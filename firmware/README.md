# Firmware — Pico W (MicroPython)

## 1. Install MicroPython on the Pico W (once)

1. Download the latest **Pico W** UF2 from https://micropython.org/download/RPI_PICO_W/
   (for a Pico 2 W use `RPI_PICO2_W`).
2. Hold **BOOTSEL**, plug in USB, then release. A drive `RPI-RP2` appears.
3. Copy the `.uf2` onto it. The Pico reboots into MicroPython.

## 2. Install the tools on your PC

```bash
pip install mpremote
```

## 3. Configure Wi-Fi

```bash
cp firmware/src/wifi_config.example.py firmware/src/wifi_config.py
# edit MODE / SSID / PASSWORD; default is AP mode "CoilTester" / "coiltest123"
```

## 4. Deploy

```bash
mpremote connect auto fs cp -r firmware/src/. :
mpremote connect auto reset
mpremote connect auto repl        # watch the log: "Coil Tester fw 0.1.0 ready: http://192.168.4.1/"
```

Ctrl-] exits the REPL. Open `http://192.168.4.1/` in a phone browser (while joined to CoilTester)
for a quick check without the app.

## 5. Host tests (no hardware)

```bash
python3 firmware/tests/run_tests.py
```

These simulate the CH-R2 circuit (GPIO drive resistance, 12-bit ADC, offset) and check the
accuracy, auto-ranging, calibration and HTTP API.

## Files

| File | Purpose |
|---|---|
| `main.py` | Boot: Wi-Fi, HTTP server |
| `net.py` | Wi-Fi STA with AP fallback |
| `httpd.py` | Tiny asyncio HTTP server + CORS |
| `app.py` | `/api/v1` routes |
| `resistance.py` | CH-R2 driver (hardware injected) |
| `rmath.py` | Pure measurement maths |
| `hw_pins.py` | Pin map (source of truth) |
| `cal.json` | Created on the Pico by "Zero leads" |
