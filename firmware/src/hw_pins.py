# Pin map: single source of truth. Keep docs/architecture.md in sync.

# --- CH-R2: 2-wire resistance meter (Phase 1) ---
R2_NODE_ADC = 26        # GP26 / ADC0: DUT+ node (via 1k series + BAT54S clamp)
R2_RANGES = {
    # name: (drive GPIO, top-sense ADC GPIO, reference ohms)
    "1k": (14, 27, 1000.0),
    "10k": (15, 28, 10000.0),
}

STATUS_LED = "LED"      # Pico W on-board LED (driven by the CYW43 chip)
