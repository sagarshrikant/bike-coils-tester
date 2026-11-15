# CH-R2 2-wire resistance meter driver. Hardware is injected so tests can use fakes.
import asyncio
import json
import time

import rmath
from hw_pins import R2_NODE_ADC, R2_RANGES

ADC_FULL = 65535
VREF = 3.3                 # only used for display; the maths is ratiometric
SETTLE_MS = 60             # coil L/R settling (pickup coils: up to ~1 H / 1 kohm = 1 ms; margin)
DISCHARGE_MS = 20
SAMPLES = 64
CAL_FILE = "cal.json"

# MicroPython has asyncio.sleep_ms; CPython (host tests) does not.
_sleep_ms = getattr(asyncio, "sleep_ms", None) or (lambda ms: asyncio.sleep(ms / 1000))


class ResistanceMeter:
    def __init__(self, adc_cls, pin_cls, cal_path=CAL_FILE):
        self._Pin = pin_cls
        self._node = adc_cls(R2_NODE_ADC)
        self._ranges = {}
        for name, (drive, top, ref) in R2_RANGES.items():
            pin = pin_cls(drive, pin_cls.IN)          # high-Z = range off
            self._ranges[name] = (pin, adc_cls(top), ref)
        self._cal_path = cal_path
        self._lock = asyncio.Lock()
        self.lead_ohms = self._load_cal().get("lead_ohms", 0.0)

    # --- calibration persistence ---
    def _load_cal(self):
        try:
            with open(self._cal_path) as f:
                return json.load(f)
        except (OSError, ValueError):
            return {}

    def _save_cal(self):
        with open(self._cal_path, "w") as f:
            json.dump({"lead_ohms": self.lead_ohms}, f)

    # --- measurement ---
    def _read_volts(self, adc):
        vals = [adc.read_u16() for _ in range(SAMPLES)]
        return rmath.trimmed_mean(vals) * VREF / ADC_FULL

    async def _measure_range(self, name):
        pin, top_adc, ref = self._ranges[name]
        pin.init(self._Pin.OUT, value=1)
        try:
            await _sleep_ms(SETTLE_MS)
            v_top = self._read_volts(top_adc)
            v_node = self._read_volts(self._node)
        finally:
            # Let the coil current decay through R_REF before going high-Z (limits inductive kick).
            pin.init(self._Pin.OUT, value=0)
            await _sleep_ms(DISCHARGE_MS)
            pin.init(self._Pin.IN)
        status, ohms = rmath.compute(ref, v_top, v_node)
        status = rmath.classify_range(name, status, ohms)
        return {"range": name, "status": status, "raw_ohms": ohms, "v_top": v_top, "v_node": v_node}

    async def measure(self, range_name="auto"):
        if range_name not in ("auto",) + tuple(self._ranges):
            raise ValueError("range must be auto, " + ", ".join(self._ranges))
        async with self._lock:
            if range_name == "auto":
                r = await self._measure_range("1k")
                if rmath.needs_higher_range(r["status"], r["raw_ohms"]):
                    r = await self._measure_range("10k")
            else:
                r = await self._measure_range(range_name)
        ohms = rmath.apply_lead_offset(r["status"], r["raw_ohms"], self.lead_ohms)
        return {
            "ok": True,
            "status": r["status"],
            "ohms": _round(ohms, 2),
            "raw_ohms": _round(r["raw_ohms"], 2),
            "range": r["range"],
            "v_top": round(r["v_top"], 4),
            "v_node": round(r["v_node"], 4),
            "lead_ohms": round(self.lead_ohms, 3),
            "samples": SAMPLES,
            "t_ms": time.ticks_ms() if hasattr(time, "ticks_ms") else int(time.time() * 1000),
        }

    async def calibrate_zero(self):
        """Clips shorted together: store the lead resistance measured on the 1k range."""
        old = self.lead_ohms
        self.lead_ohms = 0.0
        r = await self.measure("1k")
        if r["status"] not in ("ok", "short") or (r["raw_ohms"] or 0) > 5.0:
            self.lead_ohms = old
            raise ValueError("leads not shorted (read %s, %s ohm)" % (r["status"], r["raw_ohms"]))
        self.lead_ohms = r["raw_ohms"] or 0.0
        self._save_cal()
        return self.lead_ohms


def _round(v, n):
    return None if v is None else round(v, n)
