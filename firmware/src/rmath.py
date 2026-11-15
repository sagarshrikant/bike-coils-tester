# Pure resistance-measurement maths for CH-R2. No hardware imports, so it runs on the host
# (see firmware/tests). Units: volts, ohms.

SHORT_RATIO = 0.002      # v_node / v_top below this -> short (about 2 ohm on the 1k range)
OPEN_RATIO = 0.003       # (v_top - v_node) / v_top below this -> open (> ~3 Mohm on the 10k range)
MIN_V_TOP = 2.5          # drive pin should be close to 3.3 V; lower means a wiring fault
AUTO_SWITCH_OHMS = 3000  # above this on the 1k range, re-measure on the 10k range
MAX_OHMS = {"1k": 20000.0, "10k": 200000.0}


def compute(r_ref, v_top, v_node):
    """Return (status, ohms). status: ok | open | short | over_range | fault."""
    if v_top < MIN_V_TOP:
        return "fault", None
    diff = v_top - v_node
    if v_node < v_top * SHORT_RATIO:
        return "short", r_ref * v_node / diff   # keep the small value: used for lead calibration
    if diff < v_top * OPEN_RATIO:
        return "open", None
    return "ok", r_ref * v_node / diff


def classify_range(range_name, status, ohms):
    """Apply per-range validity limits to a raw result."""
    if status == "ok" and ohms > MAX_OHMS[range_name]:
        return "over_range"
    return status


def needs_higher_range(status, ohms):
    """On the 1k range: should auto-range retry on 10k?"""
    return status in ("open", "over_range") or (status == "ok" and ohms > AUTO_SWITCH_OHMS)


def apply_lead_offset(status, ohms, lead_ohms):
    if status != "ok" or ohms is None:
        return ohms
    return max(0.0, ohms - lead_ohms)


def mean(values):
    return sum(values) / len(values)


def trimmed_mean(values, trim=0.125):
    """Mean after dropping the lowest/highest `trim` fraction (handles RP2040 ADC spikes)."""
    s = sorted(values)
    k = int(len(s) * trim)
    core = s[k:len(s) - k] if len(s) - 2 * k > 0 else s
    return mean(core)
