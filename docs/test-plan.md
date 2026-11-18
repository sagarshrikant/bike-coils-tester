# Test & Measurement Plan

**Golden references:** the user's known-good pickup coil, AC-CDI and DC-CDI are the reference
units. The first time each test is run on them, the result is saved as that part's **baseline**.
Parts under test are then judged against the baseline (± tolerance) as well as the generic limits.
P4 can start with a **flick test**: pass a steel tab (screwdriver tip) quickly past the pickup.
No motor rig is needed for a first waveform.

What the tester measures for each unit under test (UUT), how it measures it, and how a result
becomes PASS or FAIL. Test IDs (`P1`, `C3` …) are used in firmware, the app and reports.

> **Typical values are only guides.** Always compare against the bike's service manual, or a
> known-good part of the same model. The app keeps editable spec presets per bike/part.

---

## 1. Pickup coil (pulser / trigger coil)

A variable-reluctance sensor: a coil on a magnet. When a reluctor tooth on the flywheel passes it,
it makes a +/− pulse whose amplitude rises with RPM.

| ID | Test | Method | Typical good value | Phase |
|---|---|---|---|---|
| P1 | DC resistance | 2-wire ratiometric (1 kΩ range) | 80 – 250 Ω (some designs up to ~500 Ω) | **1** |
| P2 | Open / short / intermittent | P1 repeated while the user flexes the lead (min/max logging) | Variation < 2 % | 1 |
| P3 | Insulation coil → body/ground | Leakage at ~50 V DC through 1 MΩ sense resistor | > 10 MΩ | 4 |
| P4 | Dynamic output | Spin a reluctor (motor rig or hand-spun flywheel) and capture the waveform: +peak, −peak, pulse width, polarity order | Peak > 0.5 V at cranking (~300 RPM), rising roughly linearly with RPM | 2 |
| P5 | Output vs RPM curve | Sweep RPM on the motor rig: Vpeak(RPM) | Smooth, monotonic, matches the reference part | 2 |
| P6 | Loaded output | P4 with a 1 kΩ / 10 kΩ load that mimics the CDI input | Drops < 30 % vs unloaded | 2 |

## 2. CDI unit

**DC-CDI:** powered from 12 V. An internal boost converter charges a capacitor (~200–400 V), which
is dumped into the coil primary through an SCR when the trigger pulse arrives.
**AC-CDI:** same idea, but the capacitor is charged from the stator's exciter (source) coil.

The CDI is a black box, so we test it through its terminals.

| ID | Test | Method | Pass criteria | Phase |
|---|---|---|---|---|
| C1 | Idle supply current (DC-CDI) | 12 V via current-limited supply, measure with shunt + ADC | Within reference ± 30 % (typically 50–300 mA) | 3 |
| C2 | Triggered output | Tester **generates simulated pickup pulses** (Pico PWM → driver) at a set RPM. Capture the output pulse via a 100:1 HV divider and peak detector | Output peak 150–400 V, one pulse per trigger | 3 |
| C3 | Missed-fire rate | C2 over N = 1000 triggers | 0 misses at 1000–8000 RPM | 3 |
| C4 | Timing / advance curve | Measure delay trigger → output at each RPM step. Advance° = Δt · RPM · 6 | Matches the reference curve within ± 2° | 3 |
| C5 | Max RPM / rev limiter | Sweep RPM until output stops or limits | Matches spec | 3 |
| C6 | Trigger sensitivity | Lower the simulated pulse amplitude until it misfires | Fires at ≤ 0.5 V | 3 |
| C7 | AC-CDI with simulated exciter | HV AC source (H-bridge + step-up transformer) replaces the stator, then C2–C6 | Same as DC | 7 |

**Load during C2–C7:** a real known-good ignition coil into an enclosed spark gap (preferred), or a
dummy load (0.5 Ω / 10 W resistor in series with the coil primary). Never fire a CDI with no load.
The open-circuit voltage can damage the SCR.

## 3. Ignition coil

Two families: **CDI coils** (low primary resistance, pulse-fired) and **TCI/inductive coils**
(higher primary resistance, charged by dwell current).

| ID | Test | Method | Typical good value | Phase |
|---|---|---|---|---|
| I1 | Primary resistance | **4-wire (Kelvin)**, 100 mA constant current + ADS1115 | CDI coil: 0.1 – 0.5 Ω; TCI coil: 2 – 5 Ω | 4 |
| I2 | Secondary resistance (HT lead to ground, cap removed) | 2-wire ratiometric (10 kΩ range) | 3 – 15 kΩ (+5 kΩ if the plug cap is resistive) | **1** |
| I3 | Insulation primary ↔ secondary / core | Leakage test at ~50 V | > 10 MΩ | 4 |
| I4 | Dynamic spark test (TCI) | Tester drives the primary with an ignition IGBT, set dwell (e.g. 3 ms) at a set RPM. Capture primary current (shunt) and flyback voltage (HV divider) | Primary current reaches the spec (~4–7 A), flyback 300–400 V, spark every time | 5 |
| I5 | Dynamic spark test (CDI coil) | Fire using a known-good CDI, or the tester's capacitor-discharge driver | Spark every time | 5 |
| I6 | Spark detection & burn time | Inductive pickup loop on the HT lead (or a photodiode at the gap) → comparator → PIO timer | Burn time 0.8 – 2 ms (TCI), 0.1 – 0.3 ms (CDI); 0 missed | 5 |
| I7 | Spark-gap test | Adjustable gap; largest gap that still sparks reliably | ≥ 6–8 mm in air (reference part) | 5 |

Voltage on the secondary (kV) is **not measured directly**. That needs a commercial HV probe.
Gap length and burn time are used as proxies.

## 4. Chain test (pickup → CDI → coil → spark)

Two modes:

**Chain-A (electronic trigger):** Tester trigger generator → CDI → coil → spark gap.
No spinning parts. Tests CDI + coil together.

**Chain-B (full mechanical):** Motor-driven reluctor → real pickup → CDI → coil → spark gap.
Tests everything, including the pickup at real RPM.
**Chain-B wiring and safety (D24, `docs/safety.md` rules 9–10):** unplug J5.1; tap the pickup into J7; close JP2 only if the pickup's return wire is the CDI ground, and open it again afterwards (it bypasses the isolation barrier).

Captured on every event, timestamped by the Pico's PIO (8 ns resolution):

| Signal | Stage | Detector |
|---|---|---|
| t0 | Pickup pulse (zero-cross / threshold) | Pickup input comparator |
| t1 | CDI output pulse | HV divider → comparator |
| t2 | Spark start, t3 spark end | Inductive HT pickup → comparator |
| ref | Reluctor index / RPM | Optical sensor on the rig (Chain-B) |

Derived results:

| ID | Result | Formula / criteria |
|---|---|---|
| X1 | RPM | 60 / period(t0) |
| X2 | Timing advance | (t1 − t0) · RPM · 6 [degrees]; compare to the reference curve |
| X3 | Coil delay | t2 − t1 (should be < 10 µs for CDI) |
| X4 | Spark burn time | t3 − t2 |
| X5 | Misfire % | events with t0 but no t2 / total |
| X6 | Fault location | If t0 is missing → pickup; t0 present but t1 missing → CDI; t1 present but t2 missing → coil/lead |

X6 is the key feature for a mechanic: **"which part in the chain failed"**.

## 5. Report contents

Each test session in the app produces a report with: date/time, bike / part name, spec preset,
tester firmware version, calibration date, every test ID run with its value, unit, limits, and
PASS/FAIL, waveforms (from Phase 3 on) and free-text notes. Export as PDF/share sheet (Phase 6).

## 6. Calibration

| What | How | When |
|---|---|---|
| Lead resistance (2-wire) | Short the test clips → "Zero" in the app | Every session |
| Reference resistors | Measure known 0.1 % resistors (100 Ω, 1 kΩ, 10 kΩ) | Monthly / after a hardware change |
| HV divider ratio | Apply a known DC voltage (e.g. 30 V) | After building |
| Timing | Loop the trigger generator into the pickup input; expected delay ≈ 0 | After a firmware change |
