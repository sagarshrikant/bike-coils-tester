# CH-TG: CDI trigger simulator with an isolated measurement bus (Phase 3, approach accepted)

Schematic: [`../diagrams/ch-tg-schematic.drawio.svg`](../diagrams/ch-tg-schematic.drawio.svg)
Decisions: D10, D11, D16, D17. Pins: [`../../docs/pin-budget.md`](../../docs/pin-budget.md).
Reference unit: [`../../docs/reference/woostar-6pin-dc-cdi.md`](../../docs/reference/woostar-6pin-dc-cdi.md).

> **Status:** approach accepted (D16, D17), not built and not bench-tested. All values are calculated or from memory of the
> datasheets, so check them at the supplier and on the bench.

## Purpose

Simulates a pickup coil so a **DC-CDI** can be tested without an engine: the Pico makes trigger pulses at a set RPM,
the CDI fires, and an ignition coil plus spark gap (in India) shows the result. Works for any DC-CDI, with the
amplitude, polarity, source impedance and pulse timing set from a profile or found by the "unknown CDI" search (D10).

## Safety

The board carries **no HV**: the CDI makes 200–400 V itself and the coil makes the kV. Fire the CDI only into a
load (coil + spark gap in a closed non-conductive box, 30 cm from the Pico and laptop). The 12 V rail is live only when
armed (D14). See `docs/safety.md`.

## What the CDI measurements told us (Woostar 6-pin)

TRIGGER + to ground is about 15 kΩ, so a trigger pulse needs under 1 mA; the two green grounds are one net;
SHUT DOWN is capacitively coupled and its active level is unknown. See the reference page.

## Architecture

Everything that touches the CDI lives in the **12 V power domain (GND_P)**. The Pico reaches it only through isolators:

| Function | Isolating element |
|---|---|
| Pulse timing (positive / negative) | PC817 optocouplers driven by GP6 / GP7 |
| Output enable | PC817 driven by an expander line (EXP1.B7) |
| Source impedance, kill outputs | photoMOS relays driven by expander lines |
| Measurement and DAC control | **ADuM1250 isolated I²C** to a second segment (SDA_P / SCL_P) |

### Supplies

- **3V3_P (always on, from `12V_RAW`):** 78L05, then a 3.3 V LDO. It powers the isolator's power side, the ADS1115 and the DACs,
  so the firmware can check the power side while the rail is still dead.
- **12V_ARMED:** the TL072 positive supply, and two regulators: **U12 78L05 → ICL7660S charge pump** that makes **−5V_P**, and **U20 78L09** that makes
  **+9V_P**, the multiplexer's positive supply (chosen with JP1). These exist only when armed.
- **Why +9 V and not 12 V for the multiplexer:** the 4052 part you chose is rated for a 3–15 V supply, and 12 V − (−5 V) = 17 V would exceed it.
  With +9 V and −5 V the span is 14 V. (The TI CD4052B tolerates more, but the Reichelt part is the 15 V type.)

### Pulse stage

A **CD4052B** analog multiplexer (X section) connects the node `S` to one of three sources, selected by two optocoupler-driven lines:

| B A | Selected | Meaning |
|---|---|---|
| 1 1 | X3 = GND | **idle**, and the default when both optocouplers are off |
| 1 0 | X2 = V_AMP+ | positive pulse (TG_PULSE_A on) |
| 0 1 | X1 = V_AMP− | negative pulse (TG_PULSE_B on) |
| 0 0 | X0 = GND | |

`INH` is pulled to `MUX_VDD` (all switches open) and pulled low by the enable optocoupler, so the output is **disabled by default**.
Break-before-make is built into the mux. Supply `MUX_VDD` +9 V and VEE −5 V = 14 V against the 15 V limit; analog signals stay between −5 V and +9 V.
The three optocoupler pull-ups (4.7 kΩ) go to `MUX_VDD`, not to 12V_ARMED, so the control pins never exceed the mux supply.
The Y section is unused (all its pins to GND_P). Edges take about 20–40 µs (PC817 with a 4.7 kΩ pull-up), which is plenty for
pulses of 0.2–10 ms.

### Amplitude (D17)

Two **MCP4725** DACs (I²C 0x60 / 0x61, on the isolated segment), each followed by half of a **TL072**:

| Bus | Circuit | Range |
|---|---|---|
| V_AMP+ | non-inverting, gain 3 (R_F 20 kΩ, R_G 10 kΩ) | 0 … 8 V (the firmware keeps the DAC code below the mux supply of +9 V) |
| V_AMP− | inverting, gain −1 (10 kΩ / 10 kΩ) | 0 … −3.3 V |

The buses are stiff DC levels. The TL072 swing is about +10 V / −3.5 V on its supplies (12 V / −5 V).
At power-up the MCP4725 may start from its stored value, so the mux idle default (GND) and `INH` keep the output safe.
These ranges are a first version; if a CDI needs more negative amplitude, the −5 V pump can be replaced by a larger one.

### Option: mux supply from the 5 V rail (JP1)

JP1 selects the multiplexer's positive supply: pins 2–3 = `+9V_P` from U20 (default), pins 1–2 = `+5V_P` from U12. With +5 V the span is
10 V and the pulse levels are limited to about +4 V / −3.3 V. Use it only if the 78L09 is a problem.

Deeper negative pulses than −3.3 V need a lower VEE and, because the mux span must stay within 15 V, a lower positive supply as well. That
is not part of this version; if a real CDI needs it, it is a small change (charge pump fed from a higher rail, VDD from the 5 V rail,
two resistor values), and it would be decided after the first tests with real units.

### Source impedance and the output

Three photoMOS (PR5–PR7) switch **100 Ω, 470 Ω, 2.2 kΩ** between `S` and `OUT`; the firmware selects exactly one.
The idle `OUT` sits at 0 V through the selected resistor, like a pickup coil at rest. A 15 V bidirectional TVS protects `OUT`.
`OUT` goes to **J5.1 (TRIG+)**. J5.3 (GND) is the CDI ground (the green wires). The CDI's `POWER +` comes from J3 (the ARM stage).

### Kill-input test

Two photoMOS on **J5.2 (SHUT DOWN)**: PR8 pulls it to GND_P through 100 Ω, PR9 pulls it to `12V_ARMED` through 1 kΩ.
Because the active level is unknown, the firmware tries each while pulses run and sees which one stops the spark (a visual check in India).

## Measurement on the isolated bus (D16)

ADS1115 (0x49, power side; a breakout module on header JM2) channels:

| Input | Signal | Divider |
|---|---|---|
| AIN0 | V_OUT_M: the real `OUT` level | 100 kΩ from OUT, 33 kΩ to GND_P, 56 kΩ to 3V3_P: −5 … +12 V → 0.15 … 3.1 V |
| AIN1 | V_AMPP_M: V_AMP+ | ÷ 3.3 (for example 68 kΩ / 30 kΩ) |
| AIN2 | V_AMPN_M: V_AMP− | 150 kΩ from V_AMP−, 100 kΩ to 3V3_P: 0 … −3.3 V → 2.0 … 0.66 V |
| AIN3 | V_ARM_M: 12V_ARMED | 100 kΩ / 27 kΩ (about × 0.21) |

The **actual pulse amplitude under load** is checked by holding a long pulse (100 ms) with the CDI disconnected and reading V_OUT_M.
The ADS1115 is too slow to see a 0.3 ms pulse, so a normal pulse's amplitude is inferred from the bus level and the load.

## Self-test and READY (D10, D11)

1. Before arming: the isolator and the power-side ADS1115 and DACs answer on the isolated bus; the expander lines respond;
   `MID_SENSE` and `ARM_SENSE` read dead.
2. After arming, with the CDI **not** connected: the rails read correct (`V_ARM_M`), V_AMP+/− follow the DAC codes, and a long test pulse
   appears on `OUT` at the expected level. Only then is the CDI connected and the test started.
3. For an unknown CDI: start at the lowest V_AMP+, step up until the CDI fires, record the threshold, offer to save it as a profile.

## Layout notes

- 12 V power domain and logic domain are separated by at least 2 mm with no copper crossing under the isolators.
- Keep OUT, S and the bus traces short. The ignition-coil current flows in GND_P, away from GND_L.
- 100 nF on every IC supply; the charge-pump capacitors close to the ICL7660.

## Open items

- Check the TL072 total supply (17 V, fine for 36 V) and the 4052 part's logic-level limits at +9 V against its datasheet (HEF4052B or CD4052B). U13 is chosen: ICL7660SCPA (DIP-8, 1.5–12 V, 45 mA); pin 1 (boost), 6 (LV) and 7 (OSC) stay open.
- Choose the exact parts: AQY212-class photoMOS for PR5–PR9, ADuM1250 or an ISO1541 equivalent, the 3.3 V LDO.
- Verify the edge times and the amplitude accuracy on the bench; check that V_AMP− is enough for real CDIs.
- Decide whether to add an INA219 current monitor on the isolated bus for the CDI supply current (not in this version).
