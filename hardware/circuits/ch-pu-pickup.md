# CH-PU: pickup dynamic input (Phase 2, approach accepted)

Measures the output of a pickup / pulser coil while a reluctor passes it: waveform, +peak, −peak,
polarity order, pulse width, frequency (RPM), and the output under a CDI-like load.
Tests P4, P5, P6 (see `docs/test-plan.md`). Resistance (P1) stays on CH-R2.

Schematic: [`../diagrams/ch-pu-schematic.drawio.svg`](../diagrams/ch-pu-schematic.drawio.svg)
Pins: [`../../docs/pin-budget.md`](../../docs/pin-budget.md)

> **Status:** approach accepted (D12), not built and not bench-tested. Values below are calculated, not
> measured. Per `CLAUDE.md`, the skill `.claude/skills/pickup-input/` is written once the design is agreed.

## ⚠ Hazard

A pickup coil produces 0.5–50 V peak, more at high RPM. That can destroy a Pico pin, but it is not a
shock hazard. **This input is for pickup coils only.** A CDI output (200–400 V pulses) or an ignition
coil (kV) must never be connected to it. The protection below limits the damage from a wrong
connection to about 2 mA, but it is not designed for HV. Disconnect the pickup from the CDI first.

## Requirements

- Unknown pickup: any amplitude from about 0.5 V to ±100 V, either polarity, source resistance 100–700 Ω.
- Auto-range from the top (principle D11-1), no setup from the service person.
- The Pico must never see more than the supply rails, even with a wrong connection.
- Self-check before use (D11-3), and a safe state after reset (D11-1).

## Signal chain

1. **Input protection.** Bidirectional TVS D1 (≈ 120 V standoff) across the input.
2. **Fixed HV divider top:** R_T1 + R_T2 = 2 × 100 kΩ, 0.6 W metal film in series (each sees half the
   voltage). Input impedance is above 200 kΩ, so the pickup is barely loaded.
3. **Switched bottom leg** (low-voltage side only, D11-2). Three resistors to V_BIAS, chosen by a
   74HC4066 analog switch. Only one is on at a time.

   | Range | Bottom leg | Ratio | Full scale (±1.5 V at the node) |
   |---|---|---|---|
   | ±5 V | R_B5 86.6 kΩ | 0.302 | ±4.96 V |
   | ±20 V | R_B20 16.2 kΩ | 0.0749 | ±20.0 V |
   | ±100 V | R_B100 3.01 kΩ | 0.0148 | ±101 V |

   The 74HC4066 on-resistance (about 100 Ω, to be measured) adds ~3 % to R_B100. It is removed by the
   self-test calibration.
4. **V_BIAS = 1.65 V:** two 10 kΩ resistors from 3V3A, 1 µF, buffered by half of an MCP6002 so it can
   source the bottom legs (up to ±0.5 mA).
5. **R_S 1 kΩ + clamp** (BAT54S pair on a **plug-in header**; see the PMEG3050EP lesson in
   `docs/test-results/phase1.md`), then **U1B MCP6002 unity buffer**, then R_OUT 100 Ω to **GP26 / ADC0**.
   The buffer keeps the ADC source impedance low and its output cannot leave the rails.
6. **Edge detection:** dual comparator U3 on the buffered signal. U3A fires on the positive threshold
   (VTHP), U3B on the negative (VTHN). Thresholds come from the dual DAC U4 (MCP4822, SPI) around V_BIAS,
   so firmware can set them from the measured peak. Outputs go to GP2 / GP3 for PIO edge timing
   (microsecond-accurate RPM and pulse width, no CPU load).
7. **Loads for P6:** photoMOS PR1 + R_L1 1 kΩ, PR2 + R_L2 10 kΩ across the input. The photoMOS must be
   a 350 V class part (the pickup voltage is across it). Normally off.
8. **Optional peak hold** (footprints, DNP): diode + 10 nF + 10 MΩ bleed per polarity, reset through
   1 kΩ by an expander line, read on GP27 / GP28. Populate only if the sampled waveform misses narrow peaks.

## Control lines (from the I/O expanders, docs/pin-budget.md)

| Net | Expander line | Drives | Default after reset |
|---|---|---|---|
| `PU_RANGE5` | EXP1.A0 | S1 (±5 V range) | off (pull-down) |
| `PU_RANGE20` | EXP1.A1 | S2 (±20 V range) | off (pull-down) |
| `PU_RANGE100` | EXP1.A2 | S3 (±100 V range) | **on** (pull-up) |
| `PU_LOAD1` | EXP1.A3 | PR1 (1 kΩ load) | off |
| `PU_LOAD2` | EXP1.A4 | PR2 (10 kΩ load) | off |
| `PU_TEST` | EXP1.A5 | self-test injection (R_INJ) | hi-Z |
| `PU_PKRST_P` / `PU_PKRST_N` | EXP1.A6 / A7 | peak-hold resets (DNP) | hi-Z |

Fast lines on the Pico: `PU_SIG` GP26 (ADC0), `PU_POS` GP2, `PU_NEG` GP3, `PU_DAC_CS` GP17 with SPI0 SCK GP18 / MOSI GP19,
and the optional `PU_PKP` GP27, `PU_PKN` GP28. The unused fourth switch of the 74HC4066 has its input and output tied to ground.

## Why this is safe

- A wrong 400 V connection: R_T1 + R_T2 limit the current to 2 mA, and the TVS clamps the input.
  Each resistor sees about 200 V, which a 0.6 W metal-film part (about 350 V rating) can take briefly.
  Do it on purpose only as an accident test, never in normal use.
- The divider node is clamped by D2/D3 behind R_S; the divider's own source impedance limits the
  clamp current (about 1.5 mA), not R_S.
- All control lines default to the safest state in hardware (highest range, loads off), because the
  expander resets to inputs and pull resistors define the state.

## Self-test (before the unit is connected)

With the clips open, the firmware drives `PU_TEST` (expander line → R_INJ 220 kΩ → the input) to 3.3 V
and 0 V on each range and reads the ADC step:

| Range | Expected step at the ADC | Ratio check |
|---|---|---|
| ±5 V | 0.56 V | |
| ±20 V | 0.12 V | |
| ±100 V | 0.023 V (about 29 counts) | |

Pass: each step within ±10 % of the calculated value. This verifies the switches, the divider
ratios, the bias, the buffer and the ADC path, and gives a gain correction per range. It does not
verify the comparator thresholds (checked by the same test: the comparator outputs must toggle once
the DAC thresholds are set below the step). The result is reported as READY or an error (D10).

## Auto-range procedure (firmware, later)

1. Start on ±100 V. Capture a short window. If the peak is under 15 % of full scale, step to ±20 V, then ±5 V. If it clips, step back up.
2. Set VTHP / VTHN to about 20 % of the measured peak. Measure frequency, pulse width and polarity order from the PIO edge times.
3. P6: repeat with PR2 (10 kΩ) and PR1 (1 kΩ) on, and report the drop against unloaded.

## Sampling note

MicroPython `ADC.read_u16()` loops give tens of ksps, enough for flick tests and cranking speeds
(pulses of milliseconds). Narrow pulses at high RPM rely on the comparator edge timing and the
optional peak hold. If a faster capture is needed later, the ADC FIFO with DMA is available in the
C SDK (decision D1).

## Bill of materials (new parts)

See `hardware/bom.md`, section "Phase 2: CH-PU".

## Open items / to verify on the bench

- 74HC4066 on-resistance at 3V3A and its effect on R_B100.
- TVS standoff voltage against real pickup peaks at high RPM (use the golden pickup, spun).
- MCP6002 unity buffer bandwidth against the fastest pickup edge.
- Comparator choice (TLV3202 or MCP6542; not the LM393, whose input range stops about 1.5 V below the supply: too small at 3.3 V) and hysteresis resistor values.
- Whether the optional peak hold is needed.
