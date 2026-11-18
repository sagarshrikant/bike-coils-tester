# Test coverage: every test ID against a connector on the mainboard

Written 2026-11-18 before the Gerbers (D24). Rule: the PCB must not need a respin for any test in `docs/test-plan.md`.
Modules marked *later* are built in milestones; what the PCB must have today is the signal path to them.
"On board" = built on the mainboard. J8, J9, J10, JP2 are the expansion connectors (`hardware/circuits/mainboard.md`).

| Test | What it needs | Where on the board | Status |
|---|---|---|---|
| P1, P2 pickup resistance | CH-R2 | J6 | on board |
| P3, I3 insulation | 50 V boost module, enable, sense | J10 `INS_EN`, `ADS1_A3`, `3V3A`, `AGND` (module later) | path ready |
| P4, P5, P6 pickup dynamic and load | CH-PU, 1 k / 10 k loads, spin rig | J7 (CH-PU on board), rig `RIG_PWM` J8-8, `RIG_TACH` J8-9 | on board / path ready |
| C1 DC-CDI idle current | inline shunt in the J3 cable, ADS1115 on the 12 V side | J9 (isolated I²C), supply from J4 (module later) | path ready |
| C2, C3, C6 triggered output, misfires, sensitivity | trigger pulses, CDI output capture, amplitude | J5 (CH-TG on board); output timing `HV_CMP` J8-6; peak value on J9; peak reset `HV_PKRST` J10; range `HV_RANGE0/1` J8-15/16 | path ready (CH-HV later) |
| C4, C5 advance curve, rev limiter | timing t0 (pickup) to t1 (CDI output), RPM sweep | t0 `PU_POS/NEG` on board, t1 `HV_CMP` J8-6, rig above | path ready |
| C7 AC-CDI | external AC power (not from the board), trigger, output capture, exciter measurement, kill of the external source | trigger J5; output as C2; exciter (100-400 V AC) through a second HV divider on the CH-HV module via J9; optional enable contact `EXP2_B2` on J10 | path ready (external source and module later) |
| I1 coil primary 4-wire | 100 mA source enable, sense | J10 `R4_EN`; sense through an ADS1115 on J8 `SDA/SCL` (0x4A) or `ADS1_A3` (module later) | path ready |
| I2 secondary resistance | CH-R2 10 k range | J6 | on board |
| I4, I5 dynamic coil test | coil driver, primary current, flyback | `DRV_OUT` J8-10; current and flyback through J9 (module later) | path ready |
| I6, I7 spark detect, gap | inductive loop comparator | `SP_IN` J8-7 | path ready (CH-SP later) |
| X1-X6 chain (A and B) | t0, t1, t2/t3, reference, fault location | `PU_POS/NEG`, `HV_CMP`, `SP_IN`, `RIG_TACH` | path ready |
| Chain-B wiring | real pickup to CDI with a tap to CH-PU | tap J7, and **JP2** (AGND to GND_P jumper) when the pickup's return is the CDI ground. **J5.1 unplugged in Chain-B** (its 15 V TVS would clip real pickup pulses) | JP2 added |

## What this does not prove

- Whether each later module fits its pins and signal types is only known when that module is designed. `J10` carries every
  spare expander line (10) so a module that needs one more control line has it.
- CH-HV, CH-I, CH-SP, the 4-wire source, the insulation tester, the coil driver and the AC source are not drawn yet.
- Average primary current for TCI coils (I4) was not checked against the 2 A output fuses F2/F3 (peaks come from the 470 µF
  capacitor): to check when the driver module is designed.
