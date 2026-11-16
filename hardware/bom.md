# Bill of materials

**Already on hand:** Pico boards, a known-good pickup coil, known-good AC-CDI and DC-CDI units,
a soldering station and general-purpose PCB.

**Get soon (needed by Phase 3):**
a known-good **ignition coil** that suits the CDIs, a spark plug or adjustable spark gap in a
non-conductive box, a **12 V bench supply with current limit** (or a 12 V battery + 5 A fuse),
a digital multimeter (to cross-check readings), and a set of 1 % reference resistors
(47 Ω, 150 Ω, 1 kΩ, 10 kΩ, 47 kΩ).

All parts are common hobby/electronics-store parts. "Phase" is when the part is first needed.

## Phase 1 — controller + CH-R2 resistance

| Qty | Part | Value / type | Notes |
|---|---|---|---|
| 1 | Raspberry Pi Pico W (or Pico 2 W) | — | Buy the version with soldered headers (WH) for easy prototyping |
| 1 | Perfboard | 7 × 9 cm or larger, double-sided | |
| 2 | Female header 1×20 | 2.54 mm | Socket the Pico, don't solder it in |
| 1 | Resistor | 1 kΩ **0.1 %** (or 1 % metal film, then calibrate) | R_REF1 |
| 1 | Resistor | 10 kΩ **0.1 %** (or 1 % metal film) | R_REF2 |
| 1 | Resistor | 1 kΩ 1 % | R_S, series protection to ADC0 |
| 1 | Diode | BAT54S (SOT-23 on an adapter) or 2 × 1N5819 / BAT85 | Clamp ADC0 to 3V3/GND |
| 3 | Capacitor | 100 nF ceramic | ADC filters |
| 1 | Capacitor | 10 µF electrolytic | 3V3 local decoupling |
| 1 | 2-pin screw terminal or 2 banana sockets | — | DUT connection |
| 2 | Test leads with crocodile clips | — | Short and thick, to keep lead resistance low |
| — | Reference resistors for testing | 47 Ω, 150 Ω, 1 kΩ, 10 kΩ, 47 kΩ (1 % or better) | Calibration and validation |
| 1 | Micro-USB cable (data) | — | Flashing |

## Phase 4 — low ohm + insulation

| Qty | Part | Notes |
|---|---|---|
| 1 | ADS1115 16-bit ADC module (I²C) | Common blue breakout |
| 1 | LM317T + 12 Ω 1 % 1 W | 1.25 V / 12.5 Ω ≈ 100 mA constant current (tune with a trim resistor) |
| 1 | Small HV boost module (nixie-tube type, 12 V in → 45–200 V adj.) | Set to ~50 V for insulation tests; 1 MΩ current-limit resistor in series (MT3608 tops out at ~28 V, too low) |
| 1 | Resistor 1 MΩ 1 % | Leakage sense |
| 2 | Logic-level MOSFET IRLZ44N or AO3400 | Enable switches |
| 4 | Kelvin clips (or 2 pairs of clips) | 4-wire measurement |

## Phase 2: CH-PU pickup input (proposed, not yet ordered)

Packages: SOIC / SOT-23 / through-hole and 0805 passives, from Reichelt, Farnell or Mouser (decision D9).
Check stock and exact order codes at the supplier. 5 % spare quantities are included in the count.

| Qty | Part | Value / type | Notes |
|---|---|---|---|
| 2 | Resistor, 0.6 W metal film (axial) | 100 kΩ 1 % | R_T1, R_T2. Rated about 350 V. Do **not** replace with 0805 |
| 1 | Resistor 0805 | 86.6 kΩ 0.1 % or 1 % | R_B5 |
| 1 | Resistor 0805 | 16.2 kΩ 0.1 % or 1 % | R_B20 |
| 1 | Resistor 0805 | 3.01 kΩ 0.1 % or 1 % | R_B100 |
| 1 | Resistor 0805 | 220 kΩ 1 % | R_INJ (self-test injection) |
| 1 | Resistor | 1 kΩ 1 W | R_L1 load (P6) |
| 1 | Resistor | 10 kΩ 0.25 W | R_L2 load (P6) |
| 3 | Resistor 0805 | 1 kΩ | R_S, R_RST ×2 |
| 3 | Resistor 0805 | 10 kΩ | R_A, R_B (V_BIAS), spare |
| 1 | Resistor 0805 | 100 Ω | R_OUT |
| 2 | Resistor 0805 | 10 MΩ | R_BL (optional peak hold) |
| 2 | Resistor 0805 | 10 kΩ | comparator pull-ups, DNP for push-pull parts |
| 1 | TVS diode, bidirectional | about 120 V standoff (for example SMAJ120CA) | D1. Check it against real pickup peaks |
| 2 | Schottky diode pair | BAT54S (SOT-23) or 2 × 1N5819 on the plug-in header | D2, D3 clamp. **Not** PMEG3050EP |
| 2 | Schottky diode | BAT54 (SOT-23) | D4, D5 optional peak hold |
| 1 | Dual op-amp, rail-to-rail | MCP6002 (SOIC-8) | U1A bias buffer, U1B signal buffer |
| 1 | Dual comparator, SOIC-8 | TLV3202 or MCP6542 (or LM393) | U3 |
| 1 | Dual 12-bit DAC, SPI | MCP4822 (SOIC-8) | U4 comparator thresholds |
| 1 | Quad analog switch | 74HC4066 (SOIC-14) | S1–S3 range switches |
| 2 | PhotoMOS relay, 350 V class, SOP-4 | for example Panasonic AQY210 family | PR1, PR2 (check the exact part and its load voltage rating) |
| 1 | Capacitor | 1 µF (ceramic) | C_B |
| 2 | Capacitor 0805 | 10 nF | optional peak hold |
| 6 | Capacitor 0805 | 100 nF | IC decoupling |
| 1 | Capacitor | 10 µF | 3V3A filter (with 10 Ω) |
| 1 | Pin header | 2.54 mm, 1×4 or 2×2 | plug-in clamp module |
| 1 | Screw terminal | 2-pin, 5.08 mm | IN+, IN− |

Shared with other blocks (listed here once): 2 × MCP23017 (I²C I/O expander, SPDIP-28 or SOIC-28),
the Pico socket headers, and the 3V3A filter parts. See `docs/pin-budget.md`.

## Power input and ARM stage (proposed, not yet ordered)

| Qty | Part | Value / type | Notes |
|---|---|---|---|
| 2 | P-channel MOSFET, TO-220 | IRF4905 (−55 V, 20 mΩ), or equivalent | Q1 reverse protection, Q2 ARM switch. Gate-source max ±20 V |
| 1 | Fuse holder + fuse | 5 A, 5 × 20 mm or blade, for the PCB | F1 |
| 2 | Resettable fuse (PTC), through-hole | 2 A hold | F2 on each output |
| 1 | TVS diode | SMBJ18A | D1 |
| 1 | Electrolytic capacitor | 470 µF, 25 V | C1 |
| 4 | Optocoupler | PC817 (DIP-4 or SOP-4) | U_ARM, U_RLY, U_MID, U_SENSE |
| 1 | Power relay, SPST-NO, 12 V coil | contacts ≥ 10 A DC, PCB mount (for example Omron G5LE-1 or Hongfa HF115F class; check the part) | K1 series relay |
| 1 | N-channel MOSFET, TO-92 | 2N7000 | Q3 relay driver |
| 1 | Diode | 1N4007 | D6 relay flyback |
| 1 | LED green + 1 LED red | 3 mm or 5 mm | 12 V present, ARMED |
| 5 | Resistor | 10 kΩ | R_G1, R_PU, R_GQ, and the PWR_EN and RLY_EN pull-downs |
| 3 | Resistor | 2.2 kΩ | R_PD, LED resistors ×2 |
| 1 | Resistor | 4.7 kΩ 0.5 W | R_BL |
| 2 | Resistor | 3.3 kΩ | R_S, R_SM |
| 2 | Resistor | 330 Ω | opto LEDs (PWR_EN, RLY_EN) |
| 1 | Toggle switch with safety cover, **DPST** (two poles), ≥ 1 A DC | panel mount | SW1 ARM (pole A: Q2 gate, pole B: relay coil) |
| 1 | Push button / E-STOP, two normally-closed contacts (or wire jumpers) | panel mount | SW2 |
| 5 | Screw terminal | 2-pin, 5.08 mm, 10 A | J1 input, J2 ×2 (SW1A/SW1B and SW2A/SW2B wiring), J3, J4 outputs |
| 1 | Isolated DC-DC module, 12 V → 5 V, 1 W | B1205S-1W class, SIP | U_ISO, **DNP**, optional |
| 1 | Schottky diode | 1N5819 | with U_ISO into Pico VSYS, DNP |

## Phase 2+ (planned, not final)

LM393 comparators, TL072 / LM358 op-amps, CD4051 analog mux, 1N4148 diodes, HV resistors
(1 MΩ × 10 in series, 1/2 W), 6N137 optocouplers, ignition IGBT ISL9V3040 or Darlington BU941ZP,
10 mΩ shunt, TCRT5000 / slotted optical sensor, small DC motor + PWM driver, adjustable spark
gap, MP1584 / LM2596 buck module, 5 A fuse holder.
