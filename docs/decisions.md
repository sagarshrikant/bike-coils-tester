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
= GND, INH default = disabled). V_AMP+ (0–8 V, see D19) and V_AMP− (0 … −3.3 V) come from two MCP4725 DACs and TL072
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

### D19 · 2026-11-16 · accepted · Mux supply limited to 15 V: +9 V from a 78L09 (U20), selected by JP1
The 4052 multiplexer available at Reichelt is the 3–15 V type. The first CH-TG design gave it 12 V − (−5 V) = 17 V. Now: VDD = +9 V (U20 78L09),
VEE = −5 V, span 14 V. JP1 can select +5 V instead. The optocoupler pull-ups go to MUX_VDD. V_AMP+ is therefore limited to about 8 V.
The earlier "±9 V option" is withdrawn (it needed an 18 V span). Found while checking the user's part choice against the datasheet limits.

### D20 · 2026-11-16 · accepted · ADS1115 as breakout modules (JM1, JM2), not the bare chip
Reichelt does not sell the ADS1115 chip. Two modules plug into 1×10 female headers: JM1 (0x48, logic side, CH-R2) and JM2 (0x49, 12 V side, CH-TG).
Easier to solder and to replace. The typical pin order (VDD, GND, SCL, SDA, ADDR, ALRT, A0–A3) must be confirmed against the module bought.

### D21 · 2026-11-16 · accepted · Part choices after the Reichelt check (op-amp, comparator, DAC, clamp, resistors, fuses)
Chosen to match what Reichelt stocks, each checked against its datasheet: U1 MCP6472-E/MS (MSOP-8, replaces MCP6002), U3 MCP6542-I/SN
(push-pull comparator, SOIC-8), U4 MCP4822-E/P (DIP-8), D2/D3 BAT54S-7-F (VF 0.24 V at 0.1 mA, IR 2 µA max), D4/D5 BAT54HT1G (SOD-323),
R_B5/R_B20/R_B100 = 84.5 kΩ / 16.5 kΩ / 3 kΩ (full scale ±5.05 / ±19.7 / ±101.5 V; firmware must use these gains), F1 ESKA 520.024 (5×20 mm, 5 A quick),
F2 SMD1812P200TF/16 (2 A hold, 16 V: keep the bench supply ≤ 15 V), D1 SM6T18CA (stand-off 15.3 V: supply ≤ 14 V), E-STOP with two NC contacts.
R_CAL1 may be a 1 % part: its measured value goes into hw_pins.py. Open: AQY210EHA vs AQY210EH, D8 must be 15 V (not 5 V), R_L2 is an NTC (wrong).

### D22 · 2026-11-17 · accepted · Optional isolated 5 V module (U_ISO) and VSYS diode (D_VSYS): not ordered, stay DNP
Default power for the Pico stays USB. No DC-DC module was ordered and none is chosen. If one is fitted later, it feeds the Pico's VSYS through a Schottky diode. The notes below are guidance for that day only; the BOM is unchanged.
- **Input from `12V_RAW`** (GND_P), not from `12V_ARMED`: the Pico must stay alive while the rail is disarmed. The module's output side is GND_L, so it is a third isolation crossing, beside the optocouplers and the ADuM1250.
- **Part: not chosen.** If one is fitted later it must accept 14 V in. A 12 V ±10 % module such as the B1205S class (10.8–13.2 V in) is too narrow, because the bench supply may run up to 14 V (D1 stand-off 15.3 V). A 9–18 V in, 5 V / 200 mA type would do. Isolation of 1–1.5 kV is plenty for 12 V.
- **D_VSYS = 1N5819** (module + → anode, VSYS → cathode). It stops USB power from back-feeding the module and the module from back-feeding USB. VSYS is then about 4.6 V, inside the Pico 2 W range (1.8–5.5 V). USB and the module can be connected together: the Pico already has its own diode from VBUS to VSYS. This replaces the "never both" wording in `power-arm.md`; `architecture.md` was already right.
- **Capacitors:** 10 µF + 100 nF on the module input (close to the pins, next to 12V_RAW) and 10 µF + 100 nF on the output (GND_L). Follow the datasheet if it asks for more.
- **Sheet:** goes on the ARM sheet (it holds 12V_RAW, GND_P and GND_L). The existing PWR_FLAG on VSYS (I/O sheet) stays, since the diode pin is passive.
- **Limits:** 200 mA total for the Pico 2 W, the 3V3 loads and anything on J8 pin 13 (VSYS). Wi-Fi peaks need a bench check with the module fitted, so USB remains the default for Phase 1. The module's layout must keep the isolation slot between its input and output pins.
Open (only if a module is ever fitted): pick the part and draw its footprint. Details: `hardware/circuits/power-arm.md`.

### D23 · 2026-11-17 · accepted · HV_RANGE0/1: pull-downs, 00 = highest range, routed to J8 pins 15 and 16
After a reset the MCP23017 pins are inputs, so a pull resistor must define the CH-HV divider range. R325 (HV_RANGE0) and R326 (HV_RANGE1), 10 kΩ to GND_L on the mainboard, so the default holds even with the CH-HV module unplugged. Code **00 = highest range** (safest for the measuring input), so the CH-HV divider must be built with every range switch off = highest range, and a more sensitive range is selected by switching a part in. This matches every other expander output (default off, pull-down) and also works with photoMOS range switches driven through a 330 Ω LED resistor, which a pull-up would not (it could not drive the LED). Firmware writes 00 first, before enabling anything on CH-HV.
HV_RANGE0 and HV_RANGE1 go to the expansion header: **J8 pin 15 = HV_RANGE0, pin 16 = HV_RANGE1** (they were unrouted, so the off-board CH-HV module could not have received them). HV_PKRST (EXP2.A4) has no J8 pin left; it stays unrouted until CH-HV is designed (bodge wire or a later header). Two ranges bits give at most four ranges.

### D24 · 2026-11-18 · accepted · Expansion headers J9 and J10 and the chain-ground jumper JP2 (no respin for any test)
Requirement (user, repeated): the PCB covers every test case (DC-CDI, AC-CDI alone and in the chain, reluctor rig to spark gap) and is not respun; modules come later. Checking `docs/test-plan.md` against the connectors (`docs/test-coverage.md`) found paths missing, so the board gets:
- **J9, 1 × 4 header, 12 V side:** 1 `SDA_P`, 2 `SCL_P`, 3 `3V3_P`, 4 `GND_P`. The isolated I²C segment, so an off-board ADS1115 (0x4A) on the CDI side can read the HV peak, the exciter coil, current shunts and flyback. Module power comes from J4.
- **J10, 2 × 10 header, logic side:** 1 `3V3`, 2 `GND_L`, 3 `R4_EN`, 4 `INS_EN`, 5 `HV_PKRST`, 6 `ADS1_ALRT`, 7 `3V3A`, 8 `ADS1_A3` (analog input of JM1, protect it on the module), 9 `AGND`, 10 `GND_L`, 11-14 `EXP1_B0`-`B3`, 15-20 `EXP2_B2`-`B7` (the 10 spare expander lines; suggestion: `EXP2_B2` = enable for an external AC source). R4_EN and INS_EN keep their 10 kΩ pull-downs; HV_PKRST and the spare lines have no pull (a module must define its own default).
- **JP2, two single pins, schematic refs JP21 (`AGND`) and JP22 (`GND_P`) (not one header, so it does not straddle the isolation slot):** `AGND` and `GND_P`, joined by a wire or jumper. Open by default. Close it only for Chain-B, where the pickup's return wire is the CDI ground. **Closed, the logic ground (and USB) is tied to the 12 V ground: the isolation barrier is bypassed.**
- **Wiring rule, no hardware:** J5.1 (`OUT`, 15 V TVS) is unplugged in Chain-B; the pickup goes to the CDI directly, with a tap to J7.
Not done, on purpose: an on-board shunt, an AC source, an HV-divider module (all later modules).

### D25 · 2026-11-18 · accepted · Order check I-937558: R_CAL1 = 510 Ω, R210 10 Ω missing
The Reichelt order was compared with the sheets (`docs/order-check-reichelt-937558.md`). All quantities are enough. Two findings:
- **R207 (R_CAL1)** was 470 Ω 0.1 % in the design, but the order has 510 Ω 0.1 %. Decision: R_CAL1 = **510 Ω** (a self-test reference whose measured value is stored in the firmware). Sheet value, `pin-budget.md`, `ch-r2-pcb.md` and the review log were updated. R524 (source impedance) stays 470 Ω 1 %.
- **R210 (10 Ω, 3V3 to 3V3A filter)** is in no order and no order list: to buy (any 0805), or a 0 Ω link meanwhile.
The parts of the order list that are not on this Reichelt order (headers, sockets, ADS1115 modules, button, E-STOP, screws, and 7 six-pin sockets for the PC817) are listed in the order-check file.

### D26 · 2026-11-18 · accepted · PCB: 2 layers, 1.6 mm, 2 mm isolation slot, net classes
Layout choices (`docs/pcb-layout-plan.md`): 2 layers, 1.6 mm, 1 oz, lead-free HASL, a plain rectangle of about 130 × 100 mm to start (no size limit from the user; shrink after placement, do not squeeze for price). Isolation: a routed slot **2 mm wide** with 0.5 mm copper pull-back on both sides (3 mm copper to copper), 5 mm solid bridges at the ends, no copper on the bridges. 2 mm instead of 3 mm because the ADuM1250 pad gap (3.9 mm) leaves 0.93 mm per side with 2 mm but only 0.45 mm with 3 mm, and 3 mm copper to copper already covers 400 V (IPC-2221, 2.5 mm). Net classes added to the project: Power5A 3 mm, Power2A 1.5 mm, PU_HV (clearance 1 mm), PowerLogic 0.5 mm, Default 0.25 mm / 0.2 mm.

D26 update (2026-11-18): the slot is **horizontal** (y 49-51, x 5-125), logic side on top, 12 V side below, because the 13 straddling parts need about 100 mm along the slot (a vertical slot has only 80 mm). 12 of them are placed in the PCB file; U506 is left to place by hand.

D26 update 2 (2026-11-18): the board is **150 × 125 mm** (not 130 × 100): the parts need about 7 800 mm² and the logic side would have been 83 % full. Slot at y 67-69, x 5-145. All 198 parts have a first draft placement (script, by zone, no overlaps); see `docs/pcb-layout-plan.md`.

### D27 · 2026-11-20 · accepted · Project name SPARKBENCH, board revisions as letters
The project and the board are called **SPARKBENCH** (subtitle "PICKUP · CDI · COIL TESTER"). The repo name, the Flutter package `coil_tester` and the org `com.bikecoils` stay as they are, because renaming them only breaks paths and app IDs. The mainboard revision is a letter: **Rev A** for the first order, Rev B for the next respin. A hand-modified board gets a pen mark (A1, A2) and no file change. The revision and date live in the KiCad title block (File → Page Settings); the silkscreen uses `${REVISION}` and `${ISSUE_DATE}`, so the board, the title block and the Gerber headers always agree. The files sent to the fab get a git tag (`hw-mainboard-revA`). Firmware and app keep their own `v0.x` numbers and say which board revision they support.

D27 update (2026-11-20): **Rev A ordered at JLCPCB** (2 layers, 1.6 mm, LeadFree HASL, 1 oz, no assembly). The files sent are `hardware/kicad/mainboard/SPARKBENCH-mainboard-RevA-gerbers.zip`, tagged `hw-mainboard-revA`.
