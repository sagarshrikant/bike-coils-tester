# CH-R2 for the PCB: 2-wire resistance sensed by the ADS1115 (approach accepted)

Schematic: [`../diagrams/ch-r2-ads1115-schematic.drawio.svg`](../diagrams/ch-r2-ads1115-schematic.drawio.svg)
Decisions: D8 (CH-R2 moves to the ADS1115), D9 (ICs on the PCB), D11 (design principles).
The circuit that is **built and measured on the perfboard** stays documented in
[`ch-r2-resistance.md`](ch-r2-resistance.md). This page is the PCB version.

> **Status:** approach accepted (D15), not built and not bench-tested. Accuracy numbers below are expectations,
> not measurements.

## What changes from the perfboard

| | Perfboard (Phase 1, built) | PCB version |
|---|---|---|
| Voltage sensing | Pico internal ADC: GP26 (node), GP27, GP28 (tops) | **ADS1115**, 16-bit, I²C: AIN0 node, AIN1 top 1k, AIN2 top 10k |
| Pico pins used | GP14, GP15, GP26, GP27, GP28 | GP14, GP15 only (+ the I²C bus shared with other channels) |
| Self-test | none | two precision reference resistors switched across the DUT terminals (PR3, PR4) |
| Protection | R_S + clamp diodes | R_S + plug-in clamp + TVS D7 across the DUT terminals |
| Resistors | whatever was in the box | R_REF 0.1 %, R_CAL 0.1 % |

The measuring circuit itself (R_REF1 1 kΩ on GP14, R_REF2 10 kΩ on GP15, ratiometric formula
`R_dut = R_REF · V_node / (V_top − V_node)`) is **unchanged**.

## Why the ADS1115

The Phase 1 bench work showed the readings were limited by the Pico's ADC path and by the leaky clamp
diodes, not by the circuit. The ADS1115 has 16 bits, a stable internal reference shared by all three channels
(the formula is ratiometric, so the reference value cancels), and an offset of a few LSB. It also frees GP26–28 for CH-PU.

## Channel map and settings

| ADS1115 input | Signal | Notes |
|---|---|---|
| AIN0 | V_node (DUT+ via R_S, clamp, 100 nF) | PGA ±4.096 V; switch to ±0.512 V when V_node is low (low ohms) |
| AIN1 | V_top, 1k range (R 1 kΩ + 100 nF filter) | PGA ±4.096 V |
| AIN2 | V_top, 10k range | PGA ±4.096 V |
| AIN3 | spare (test pad) | |

Address 0x48 (ADDR to GND). Single-ended, single-shot conversions, 128 to 860 SPS. Resolution at ±4.096 V is
125 µV per count (about 0.1 % of a 0.15 V node voltage, which is a 47 Ω resistor on the 1k range).
Input impedance of the ADS1115 depends on the PGA setting (several MΩ, check the datasheet); the 1 kΩ series
resistors add an error well under 0.05 %, which the self-test calibrates out.

**Measurement order (per range):** drive the pin high, wait 60 ms, read V_top, V_node, V_top again, average
the two V_top values, then drive LOW for 20 ms and release (as in the perfboard firmware).

## Self-test (D11-3)

With the **clips open**:
1. Close PR3 (R_CAL1 510 Ω 0.1 %, D25) and measure on the 1k range. Expect 510 Ω ± 3 %.
2. Open PR3, close PR4 (R_CAL2 47 kΩ 0.1 %) and measure on the 10k range. Expect 47 kΩ ± 3 %.
3. Open both.

This checks the drive pins, R_REF1/2, the divider, the ADS1115 and the I²C bus together. If a clip is
connected to something the result will be off: the firmware says "remove the clips" (a reading far below
nominal means something is connected). The error from the two measurements also gives a per-range gain
correction (kept in memory, not in the DUT result).

## Control lines

`R2_DRIVE_1K` (GP14) and `R2_DRIVE_10K` (GP15) drive the two ranges. The self-test photo-relays are `R2_CAL1` (EXP2.A6, PR3, 510 Ω since D25)
and `R2_CAL2` (EXP2.A7, PR4, 47 kΩ), both off after reset. The ADS1115 module (JM1) sits on the main I²C bus (GP4 / GP5).

## Protection

- **R_S 1 kΩ + plug-in clamp header (BAT54S) + 100 nF** at the node, as on the perfboard. The clamp
  diodes are on a header so they can be swapped without desoldering (PMEG3050EP lesson).
- **D7: 5 V bidirectional TVS** across the DUT terminals for static and kicks.
- **The ADS1115 inputs must not leave −0.3 V to 3.6 V.** The clamp and R_S keep the node inside that
  during the turn-off kick (about −3 V on the node, a few mA through R_S).
- Not protected against a live source: a spinning pickup, a CDI output or an ignition coil connected to
  these terminals can damage GP14/GP15 through R_REF. Use CH-PU for pickups. This channel is for coils at rest.

## Layout notes

- Place R_REF1/2, R_S, the clamp header and the three 100 nF capacitors close to the Pico pins and the ADS1115.
- One AGND point at the DUT− terminal; keep the clip return away from the digital ground currents.
- Short, wide traces from the terminals, twisted pair to the clips. Lead resistance is removed by the "Zero" calibration.
- The ADS1115 is fitted as a **breakout module** on a 1×10 female header (JM1), because Reichelt does not sell the bare chip. Pin order of the
  typical module: VDD, GND, SCL, SDA, ADDR, ALRT, A0, A1, A2, A3 (confirm with the module you buy). ADDR is tied to GND on the board (0x48).

## Firmware change (when the PCB firmware is written)

`resistance.py` reads `V_top` and `V_node` through an ADS1115 driver instead of `ADC.read_u16()`. `rmath.py` and the
API stay the same. `hw_pins.py` drops `R2_NODE_ADC` and the top-sense GPIOs and gains the ADS1115 channel numbers.
Re-check the readings against the resistor table in `docs/test-results/phase1.md` after the change.

## Open items

- Confirm the accuracy improvement on the bench (47 Ω, 100 Ω, 47 kΩ, the golden pickup coil).
- Check BAT54S leakage on the ADS1115 input at the node.
- Decide the lowest-ohm limit with the ±0.512 V PGA setting.
- The CH-TG power-side ADS1115 (0x49) is a second module (JM2). A third module (0x4A) would be for the Phase 4 4-wire channel.
