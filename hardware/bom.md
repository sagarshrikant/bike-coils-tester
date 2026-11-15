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

## Phase 2+ (planned, not final)

LM393 comparators, TL072 / LM358 op-amps, CD4051 analog mux, 1N4148 diodes, HV resistors
(1 MΩ × 10 in series, 1/2 W), 6N137 optocouplers, ignition IGBT ISL9V3040 or Darlington BU941ZP,
10 mΩ shunt, TCRT5000 / slotted optical sensor, small DC motor + PWM driver, adjustable spark
gap, MP1584 / LM2596 buck module, 5 A fuse holder.
