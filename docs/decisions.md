# Decision log

Format: ID · date · status (proposed / accepted / superseded) · decision · why.

### D1 · 2026-11-15 · proposed · Firmware in MicroPython
Fast to iterate, REPL on the bench, built-in Wi-Fi and BLE support on the Pico W, and PIO is still
available for µs timing. If Phase 3–5 timing or throughput turns out too slow, move the hot paths
to the C/C++ Pico SDK (keeping the same HTTP API).

### D2 · 2026-11-15 · proposed · Wi-Fi + HTTP JSON first, BLE later
The app has to work as a **web app** too. Browsers can't use BLE reliably (Web Bluetooth is
Chrome-only and missing on iOS), but they can use HTTP/WebSocket. AP mode means no router is
needed in the workshop. BLE comes in Phase 7 for a phone-only, low-power mode.

### D3 · 2026-11-15 · accepted · Flutter for the app
One codebase for Android, iOS and Web. (User's choice.)

### D4 · 2026-11-15 · accepted · Diagrams as editable `.drawio.svg`
Renders anywhere (GitHub, browser) and opens for editing in draw.io. (User requirement.)

### D5 · 2026-11-15 · proposed · Perfboard modules per channel, KiCad for the final PCB
Each measurement channel is a separate small perfboard module, so faults are isolated and
modules can be rebuilt one at a time. KiCad (free, widely used) for Phase 8.

### D6 · 2026-11-15 · proposed · CH-R2 uses ratiometric sensing with measured top voltage
Both ends of the reference resistor are measured, so GPIO drive droop and 3V3 rail error cancel
out. Range switching uses the GPIO high / high-Z state, with no relays needed.

### D7 · 2026-11-16 · accepted · Golden baselines are stored in the app (on the device or browser)
The app saves the lead-corrected reading of a known-good part as that part type's baseline (one per
test ID, for example P1) and shows the deviation of later readings, with a default tolerance of
± 5 %. It uses `shared_preferences` (browser local storage on web) behind a `BaselineStore`
interface, so it can move to the Pico later. Why now: it needs no firmware or API change and
unblocks the Phase 1 exit test. Limits: a baseline lives only in the browser/device that saved it
(the laptop and the iPhone don't share), and Safari can clear site storage after about a week of
not visiting the site. Record important baselines in `docs/test-results/`.
