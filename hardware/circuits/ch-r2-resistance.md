# CH-R2 — 2-wire resistance meter (Phase 1)

Measures: pickup coil (P1), AC-CDI exciter coil, ignition coil secondary (I2), and in general any
coil from ~20 Ω to 200 kΩ. Ignition **primary** (< 5 Ω) needs CH-R4 (Phase 2).

Wiring diagram: [`../diagrams/ch-r2-resistance.drawio.svg`](../diagrams/ch-r2-resistance.drawio.svg)

## Principle

A reference resistor R_REF and the DUT form a divider, driven by a GPIO pin set high.
The firmware measures the voltage at **both** ends of R_REF:

```
R_dut = R_REF · V_node / (V_top − V_node)
```

Because V_top is measured, not assumed to be 3.3 V, GPIO output droop and 3V3 rail error cancel
out. Only R_REF accuracy and ADC linearity matter.

Two ranges. Only one GPIO drives at a time; the other is set to input (high-Z) and has no effect.

| Range | R_REF | Drive pin | Top sense | DUT current | Best accuracy |
|---|---|---|---|---|---|
| 1k | 1 kΩ 0.1 % | GP14 | GP27 / ADC1 | ≤ 3.3 mA | 20 Ω – 3 kΩ |
| 10k | 10 kΩ 0.1 % | GP15 | GP28 / ADC2 | ≤ 0.33 mA | 3 kΩ – 200 kΩ |

Expected accuracy with the Pico's ADC, averaging 64 samples: **± 2 % from 50 Ω to 100 kΩ**,
about ± 5 % at 20 Ω and 200 kΩ.

## Schematic

```
             GP14 ──┬──────────[ R_REF1 1k 0.1% ]──────┐
                    │                                   │
             GP27 ──┘ (ADC1, top sense, 1k range)        │
                                                        │
             GP15 ──┬──────────[ R_REF2 10k 0.1% ]─────┤
                    │                                   │
             GP28 ──┘ (ADC2, top sense, 10k range)       │
                                                        ├──────────●  DUT +  (red clip)
                                                        │
                                       ┌──[ R_S 1k ]────┘
                                       │
             GP26 (ADC0) ──────────────┤
                                       ├── BAT54S: diode to 3V3 and diode to GND (clamp)
                                       └── C1 100 nF ── GND

             GND (pin 38 / AGND pin 33) ────────────────────────────●  DUT −  (black clip)

     Also:  100 nF from GP27 → GND and GP28 → GND (C2, C3), placed at the Pico pins.
            10 µF + 100 nF across 3V3 (pin 36) and GND near the Pico.
```

## Perfboard notes

1. Socket the Pico W on female headers, USB connector at the board edge.
2. Keep R_REF1, R_REF2, R_S and the clamp diode close to the Pico's GP26-28 pins
   (physical pins 31–34). Use **AGND (pin 33)** as the ground for C1-C3 and DUT−.
3. Use short, thick leads to the clips, and twist the red/black pair. Lead resistance is
   removed with the "Zero" calibration, but it must stay stable.
4. **Before plugging in the Pico:** check with a multimeter that DUT+ and DUT− are not shorted
   to 3V3 or VSYS.

## Safety / protection

- Never measure a coil that is still connected to a running bike or a powered CDI.
- Disconnect the coil from the CDI before measuring. The CDI side can hold charge.
- R_S + BAT54S protect ADC0 against the inductive kick when the drive turns off. The firmware
  also drives the pin **low** for 20 ms before releasing it, so the coil current decays through
  R_REF.

## Bring-up test

1. No DUT (open): the app should show **OPEN**.
2. Short the clips: **SHORT**, then press **Zero**, which stores the lead resistance.
3. Measure 47 Ω, 150 Ω, 1 kΩ, 10 kΩ and 47 kΩ resistors. Record them in
   `docs/test-results/phase1.md`. All should be within ± 2 % (± 3 % for 47 Ω).
4. Measure a real pickup coil and an ignition coil secondary.
