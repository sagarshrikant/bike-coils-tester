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

### D8 · 2026-11-16 · accepted · CH-R2 moves to the ADS1115 (node and both top-sense voltages)
Frees the three internal ADC pins (GP26–28) for CH-PU and later channels, and gives 16-bit
readings with one shared reference. The circuit is unchanged; `resistance.py` and `hw_pins.py`
change when the PCB firmware is written. Re-check the CH-R2 readings after the change.

### D9 · 2026-11-16 · accepted · ICs on the PCB instead of breakout modules (except the Pico 2 W)
Cost, and the board has to be soldered anyway. Use SOIC / SOT-23 / through-hole parts and 0805
passives, all from Reichelt, Farnell or Mouser. The one fine-pitch part is the ADS1115
(VSSOP-10, 0.5 mm): add a parallel module-header footprint (DNP) as a fallback. One PCB for the
designed blocks, with an expansion connector for the HV blocks (separate boards). JLCPCB, 5-piece minimum.

### D10 · 2026-11-16 · accepted · Profile-driven, self-checking, programmable test hardware
The tester has to work on units nobody has data for (any Indian-market DC/AC CDI, pickup or
ignition coil), operated by a non-expert. Workflow: the service person picks a profile (or
"Unknown / generic") in the app, the Pico programs the hardware, runs a self-test (measures what it
actually set), reports READY, and only then is the power stage armed. Details:
- **ARM switch** cuts only the 12 V power stage and the outputs. The Pico, ADS1115 and the stored
  settings stay powered, so wires are connected with every output dead. ARMED LED next to the
  switch. Firmware refuses to arm if the self-test failed.
- Programmability uses **fixed precision resistors switched by opto-isolated photo-relays** (for
  example TLP172 / AQY212 class) on the isolated 12 V side, and analog switches on low-voltage
  nodes. Digital potentiometers only for low-voltage trims where ± 20 % tolerance is acceptable
  (calibrated by self-test).
- **Profiles live in the app first** (JSON list with an editor). The Pico gets the active profile
  through the API (update `docs/architecture.md` and `app/lib/api/` together when it is added).
- **"Unknown" profile:** start at the lowest energy, step up until the unit responds, record the
  threshold, offer to save it as a new profile.

### D11 · 2026-11-16 · accepted · Design principles for every measurement channel
1. **Start safe, step up.** Lowest range, lowest amplitude, shortest dwell first. Auto-range from
   the top for unknown input voltages.
2. **Program the low-voltage side, keep the high-voltage side fixed and passive.** HV dividers are
   fixed HV-rated resistors. Only the low-voltage bottom leg is switched, so no switch sees more
   than 3.3 V.
3. **Self-test before arming,** using an internal precision reference path read by the ADS1115.
4. **Limits in hardware as well as firmware** (current limit, series resistors, clamps, fuse).
5. **No data needed from the user beyond a few simple choices.** Everything else is found by
   measuring.

### D12 · 2026-11-16 · accepted · CH-PU architecture (supersedes the earlier sketch in docs/architecture.md)
Fixed HV-rated top divider (2 × 100 kΩ), switched bottom legs (±5 / ±20 / ±100 V) on a 74HC4066, 1.65 V
bias via a buffered divider, MCP6002 buffer into GP26, and a dual comparator with DAC-set thresholds
(MCP4822) for PIO edge timing. Photo-relay loads for P6. Self-test by injecting 3.3 V / 0 V through a
220 kΩ resistor. Optional peak-hold footprints (DNP). Why: handles any pickup without setup (D10, D11),
no switch ever sees more than 3.3 V, the earlier 1:40 single divider could not auto-range.
Details: `hardware/circuits/ch-pu-pickup.md`. Status: approach accepted 2026-11-16; values still to be verified on the bench.

### D13 · 2026-11-16 · accepted · I²C I/O expanders for slow control lines
Two MCP23017 (I²C, 0x20 / 0x21) carry range, load, enable and relay lines, because the Pico has too few
free pins for the whole product (about 36 lines needed, about 21 free). Fast and timing-critical lines stay
on Pico GPIO. Every expander line has a pull resistor that sets the safe state, since the expander resets to
inputs. Details: `docs/pin-budget.md`.

### D15 · 2026-11-16 · accepted · CH-R2 on the PCB: ADS1115 sensing, self-test, TVS
Same measuring circuit as the perfboard, sensed by an ADS1115 (D8). Added: two precision reference resistors
switched across the DUT terminals by photo-relays (PR3 470 Ω, PR4 47 kΩ) for a clips-open self-test (D11-3),
a 5 V TVS across the DUT terminals, 0.1 % resistors, and a 1 kΩ + 100 nF filter on each top-sense line.
The perfboard circuit stays documented as built. Details: `hardware/circuits/ch-r2-pcb.md`.

### D16 · 2026-11-16 · accepted · Isolated I²C segment for power-domain measurement
Everything that touches the CDI is in the 12 V power domain (GND_P), so measuring it needs an isolated path.
One ADuM1250-class I²C isolator extends the main bus to a power-side segment. The power side runs from a
non-isolated regulator chain on `12V_RAW` (78L05, 3.3 V LDO), so no isolated DC-DC module is needed (it stays
optional, for running the Pico from the 12 V supply). On the segment: ADS1115 0x49 (OUT level, V_AMP+/−, 12V_ARMED) and two MCP4725
DACs. The same segment serves CH-HV later. Details: `hardware/circuits/ch-tg-trigger.md`.

### D17 · 2026-11-16 · accepted · CH-TG: DAC-set amplitude, mux pulse stage, ±pulses, kill outputs
Pulse = CD4052B analog mux switching between V_AMP+, V_AMP− and GND, selected by two optocouplers (idle and default
= GND, INH default = disabled). V_AMP+ (0–9.9 V) and V_AMP− (0 … −3.3 V) come from two MCP4725 DACs and TL072
stages on 12V_ARMED / −5V_P (charge pump). Source impedance 100 Ω / 470 Ω / 2.2 kΩ by photoMOS. Two photoMOS on
SHUT DOWN (to GND_P and to 12V_ARMED) because the kill level is unknown. Supersedes the "photoMOS amplitude bank" in D10 (which was chosen
before the isolated measurement bus existed). Jumper JP1 selects the mux VDD (12V_ARMED by default), so the negative range can later be deepened (±9 V version: 78L09 in place of the 78L05, JP1 moved, two resistor values changed) without a new PCB.
Details: `hardware/circuits/ch-tg-trigger.md`.

### D14 · 2026-11-16 · accepted · Two power domains and the ARM stage
The 12 V power domain (CDI supply, trigger drivers, coil driver later) has its own ground (GND_P) and is
isolated from the logic domain (Pico, ADC, expanders, measurement side) by optocouplers. A P-channel
MOSFET (Q2) switches `12V_ARMED`. It turns on only when firmware `PWR_EN` (GP22), the physical ARM
switch (SW1) and the E-STOP loop (SW2) all agree. `ARM_SENSE` (GP13) reads the real rail through a
second optocoupler. The Pico watchdog is enabled while armed, and `PWR_EN` has a pull-down, so a hang
or reset turns the rail off. The Pico runs from USB, or from an optional isolated 12 V → 5 V module.
A **series relay K1** (added 2026-11-16 at the user's request) makes a second, independent switch: its own
enable (`RLY_EN`, GP0), optocoupler, Q3 driver and the second poles of a DPST ARM switch and a two-contact
E-STOP. `MID_SENSE` between the two switches shows which one failed. The relay closes first and opens last,
so it never breaks load current. Only a double failure (Q2 shorted and K1 welded) leaves the rail live.
Details: `hardware/circuits/power-arm.md`.

### D18 · 2026-11-16 · accepted · One mainboard PCB with a logic / 12 V split
One board (JLCPCB, 5-piece minimum) carries CH-R2, CH-PU, the ARM stage, CH-TG, the Pico socket, two MCP23017 expanders and
the I²C bus. The logic region (GND_L) and the 12 V power region (GND_P) are separated by an isolation slot bridged only by
optocouplers, photoMOS relays and the ADuM1250. HV blocks (CH-HV, insulation, AC-CDI) stay off this board and plug into
a 2 × 8 expansion header (J8) and the aux 12 V output (J4). Connection list: `hardware/circuits/mainboard.md`.
