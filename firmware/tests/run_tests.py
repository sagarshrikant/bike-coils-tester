#!/usr/bin/env python3
"""Host-side tests for the Pico firmware logic (CPython 3.8+, no dependencies).

Usage: python3 firmware/tests/run_tests.py
The circuit (GPIO drive, reference resistors, DUT, 12-bit ADC) is simulated, so the measurement
code is exercised end to end without hardware.
"""
import asyncio
import json
import os
import sys
import tempfile
import traceback

sys.dont_write_bytecode = True  # keep firmware/src clean: it is copied to the Pico as-is

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "src"))

import rmath  # noqa: E402
import resistance  # noqa: E402
import app  # noqa: E402
from hw_pins import R2_NODE_ADC, R2_RANGES  # noqa: E402

resistance.SETTLE_MS = 0
resistance.DISCHARGE_MS = 0


# ---------------------------------------------------------------- simulated hardware
class Circuit:
    VDD = 3.30
    R_GPIO = 35.0        # GPIO output resistance
    ADC_OFFSET_LSB = 1   # small ADC offset (12-bit LSBs)

    def __init__(self, r_dut):
        self.r_dut = r_dut   # None = open
        self.pins = {}

    def active(self):
        on = [(p, rng) for rng, (p, top, ref) in R2_RANGES.items()
              if self.pins.get(p) == ("out", 1)]
        assert len(on) <= 1, "two ranges driven at once"
        return on[0] if on else (None, None)

    def volts(self, gpio):
        pin, rng = self.active()
        if pin is None:
            return 0.0
        _, top_gpio, ref = R2_RANGES[rng]
        r_series = self.R_GPIO + ref
        if self.r_dut is None:
            i = 0.0
        else:
            i = self.VDD / (r_series + self.r_dut)
        v_pin = self.VDD - i * self.R_GPIO
        v_node = self.VDD if self.r_dut is None else i * self.r_dut
        if gpio == top_gpio:
            return v_pin
        return v_node        # node ADC, or the inactive range's top sense (reads node through R_REF)

    def adc_cls(self):
        circuit = self

        class FakeADC:
            def __init__(self, gpio):
                self.gpio = gpio

            def read_u16(self):
                code = int(circuit.volts(self.gpio) / circuit.VDD * 4095 + 0.5) + circuit.ADC_OFFSET_LSB
                return max(0, min(4095, code)) << 4

        return FakeADC

    def pin_cls(self):
        circuit = self

        class FakePin:
            IN, OUT = 0, 1

            def __init__(self, gpio, mode=0):
                self.gpio = gpio
                self.init(mode)

            def init(self, mode, value=0):
                circuit.pins[self.gpio] = ("out", value) if mode == 1 else ("in", None)

        return FakePin


def make_meter(r_dut, cal_dir):
    c = Circuit(r_dut)
    return c, resistance.ResistanceMeter(c.adc_cls(), c.pin_cls(), os.path.join(cal_dir, "cal.json"))


def run(coro):
    return asyncio.run(coro)


# ---------------------------------------------------------------- tests
def test_compute_basic():
    st, r = rmath.compute(1000, 3.3, 1.65)
    assert st == "ok" and abs(r - 1000) < 1e-9
    assert rmath.compute(1000, 3.3, 0.001)[0] == "short"
    assert rmath.compute(1000, 3.3, 3.2995) == ("open", None)
    assert rmath.compute(1000, 1.0, 0.5) == ("fault", None)


def test_range_logic():
    assert rmath.classify_range("1k", "ok", 25000) == "over_range"
    assert rmath.classify_range("10k", "ok", 25000) == "ok"
    assert rmath.needs_higher_range("ok", 4700)
    assert not rmath.needs_higher_range("ok", 150)
    assert rmath.needs_higher_range("open", None)
    assert rmath.apply_lead_offset("ok", 150.4, 0.4) == 150.0
    assert rmath.apply_lead_offset("open", None, 0.4) is None


def test_trimmed_mean_rejects_spikes():
    vals = [1000] * 56 + [4000] * 4 + [0] * 4
    assert rmath.trimmed_mean(vals) == 1000


def test_meter_accuracy_across_values():
    with tempfile.TemporaryDirectory() as d:
        for r_true, expect_range, tol in [(47, "1k", 0.03), (150, "1k", 0.02), (1000, "1k", 0.02),
                                          (2700, "1k", 0.02), (10000, "10k", 0.02),
                                          (47000, "10k", 0.02), (150000, "10k", 0.04)]:
            _, m = make_meter(r_true, d)
            res = run(m.measure("auto"))
            assert res["status"] == "ok", res
            assert res["range"] == expect_range, (r_true, res["range"])
            err = abs(res["ohms"] - r_true) / r_true
            assert err < tol, "R=%s read %s (err %.2f%%)" % (r_true, res["ohms"], err * 100)


def test_meter_open_and_short():
    with tempfile.TemporaryDirectory() as d:
        _, m = make_meter(None, d)
        r = run(m.measure("auto"))
        assert r["status"] == "open" and r["ohms"] is None and r["range"] == "10k", r
        _, m = make_meter(0.2, d)
        assert run(m.measure("auto"))["status"] == "short"
        _, m = make_meter(5e6, d)
        assert run(m.measure("auto"))["status"] in ("open", "over_range")


def test_ranges_released_after_measure():
    with tempfile.TemporaryDirectory() as d:
        c, m = make_meter(150, d)
        run(m.measure("auto"))
        for rng, (pin, _, _) in R2_RANGES.items():
            assert c.pins[pin] == ("in", None), (rng, c.pins[pin])


def test_zero_calibration_persists():
    with tempfile.TemporaryDirectory() as d:
        c, m = make_meter(1.0, d)              # leads shorted, 1 ohm of lead resistance
        lead = run(m.calibrate_zero())
        assert 0.5 < lead < 1.5, lead
        with open(os.path.join(d, "cal.json")) as f:
            assert abs(json.load(f)["lead_ohms"] - lead) < 1e-9
        c.r_dut = 151.0                        # 150 ohm coil + 1 ohm leads
        _, m2 = make_meter(151.0, d)           # new instance loads the calibration
        assert abs(run(m2.measure("1k"))["ohms"] - 150) < 3


def test_zero_calibration_rejects_open_leads():
    with tempfile.TemporaryDirectory() as d:
        _, m = make_meter(220.0, d)
        try:
            run(m.calibrate_zero())
        except ValueError:
            pass
        else:
            raise AssertionError("expected ValueError")
        assert m.lead_ohms == 0.0


def test_api_routes():
    with tempfile.TemporaryDirectory() as d:
        _, m = make_meter(150, d)
        srv = app.build(m, {"mode": "ap", "ip": "192.168.4.1"})

        st, ct, body = run(srv.dispatch("GET", "/api/v1/info"))
        info = json.loads(body)
        assert st == 200 and info["ip"] == "192.168.4.1" and info["fw_version"] == app.FW_VERSION

        st, _, body = run(srv.dispatch("GET", "/api/v1/resistance?range=1k"))
        r = json.loads(body)
        assert st == 200 and r["ok"] and abs(r["ohms"] - 150) < 3

        st, _, body = run(srv.dispatch("GET", "/api/v1/resistance?range=bogus"))
        assert st == 400 and not json.loads(body)["ok"]

        assert run(srv.dispatch("GET", "/nope"))[0] == 404
        assert run(srv.dispatch("POST", "/api/v1/info"))[0] == 405
        assert run(srv.dispatch("OPTIONS", "/api/v1/resistance"))[0] == 204
        st, ct, body = run(srv.dispatch("GET", "/"))
        assert st == 200 and ct.startswith("text/html")


def test_http_over_tcp_with_cors():
    async def go(d):
        _, m = make_meter(1000, d)
        srv = app.build(m, {"mode": "ap", "ip": "127.0.0.1"})
        server = await srv.serve("127.0.0.1", 0)
        port = server.sockets[0].getsockname()[1]
        reader, writer = await asyncio.open_connection("127.0.0.1", port)
        writer.write(b"GET /api/v1/resistance?range=auto HTTP/1.1\r\nHost: x\r\nOrigin: http://localhost\r\n\r\n")
        await writer.drain()
        raw = await reader.read()
        writer.close()
        server.close()
        await server.wait_closed()
        return raw

    with tempfile.TemporaryDirectory() as d:
        raw = run(go(d))
    head, _, body = raw.partition(b"\r\n\r\n")
    assert head.startswith(b"HTTP/1.1 200 OK"), head
    assert b"Access-Control-Allow-Origin: *" in head
    r = json.loads(body)
    assert r["status"] == "ok" and abs(r["ohms"] - 1000) < 20


def main():
    tests = [(n, f) for n, f in globals().items() if n.startswith("test_") and callable(f)]
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print("PASS", name)
        except Exception:
            failed += 1
            print("FAIL", name)
            traceback.print_exc()
    print("\n%d passed, %d failed" % (len(tests) - failed, failed))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
