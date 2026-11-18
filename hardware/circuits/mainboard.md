# Mainboard integration (PROPOSED)

Schematic (overview): [`../diagrams/mainboard-schematic.drawio.svg`](../diagrams/mainboard-schematic.drawio.svg)
Pin source of truth: [`../../docs/pin-budget.md`](../../docs/pin-budget.md). Decision: D18.
Blocks: [`ch-r2-pcb.md`](ch-r2-pcb.md), [`ch-pu-pickup.md`](ch-pu-pickup.md), [`power-arm.md`](power-arm.md),
[`ch-tg-trigger.md`](ch-tg-trigger.md).

> **Status:** design proposal, not built. This page is the connection list for drawing the KiCad schematic.
> Reference designators in the block pages (U1, U2 ...) repeat between blocks; KiCad annotation will give unique ones.

## Board partition

| Region | Ground | Contents |
|---|---|---|
| Logic | GND_L (AGND star at Pico pin 33) | Pico socket, 2 × MCP23017, ADS1115 0x48, CH-R2, CH-PU, J6, J7, J8 |
| 12 V power | GND_P | J1–J5, ARM stage, CH-TG, power-side ADS1115 0x49 and DACs |
| Between | | isolation slot at least 2 mm, no copper crossing. Only PC817 optocouplers, photoMOS relays and the ADuM1250 bridge it |

## Pico 2 W socket

2 × 1×20 female header, 2.54 mm, 17.78 mm apart (Pico 2 W pitch). Pins:

| Pin | Name | Net | Goes to |
|---|---|---|---|
| 1 | GP0 | RLY_EN | ARM: relay optocoupler LED (330 Ω), 10 kΩ pull-down |
| 2 | GP1 | spare | J8 |
| 3, 8, 13, 18, 23, 28, 38 | GND | GND_L | |
| 4 | GP2 | PU_POS | CH-PU comparator A |
| 5 | GP3 | PU_NEG | CH-PU comparator B |
| 6 | GP4 | SDA | I²C bus (4.7 kΩ pull-up) |
| 7 | GP5 | SCL | I²C bus (4.7 kΩ pull-up) |
| 9 | GP6 | TG_PULSE_A | CH-TG optocoupler A (330 Ω) |
| 10 | GP7 | TG_PULSE_B | CH-TG optocoupler B (330 Ω) |
| 11 | GP8 | HV_CMP | J8 (CH-HV later) |
| 12 | GP9 | SP_IN | J8 (CH-SP later) |
| 14 | GP10 | RIG_PWM | J8 |
| 15 | GP11 | RIG_TACH | J8 |
| 16 | GP12 | DRV_OUT | J8 |
| 17 | GP13 | ARM_SENSE | ARM sense optocoupler (10 kΩ pull-up) |
| 19 | GP14 | R2_DRIVE_1K | CH-R2 R_REF1 |
| 20 | GP15 | R2_DRIVE_10K | CH-R2 R_REF2 |
| 21 | GP16 | spare (SPI MISO) | J8 |
| 22 | GP17 | PU_DAC_CS | CH-PU MCP4822 CS |
| 24 | GP18 | SPI0_SCK | CH-PU MCP4822 SCK |
| 25 | GP19 | SPI0_MOSI | CH-PU MCP4822 SDI |
| 26 | GP20 | EXP_RESET | both MCP23017 RESET, 10 kΩ pull-up |
| 27 | GP21 | EXP_INT | MCP23017 INTA (optional), J8 |
| 29 | GP22 | PWR_EN | ARM switch-1 optocoupler LED (330 Ω), 10 kΩ pull-down |
| 30 | RUN | RUN | push button to GND (SW_RST) |
| 31 | GP26 / ADC0 | PU_SIG | CH-PU buffer output (via R_OUT 100 Ω) |
| 32 | GP27 / ADC1 | PU_PKP | CH-PU positive peak hold (DNP) |
| 33 | AGND | AGND | analog star point: DUT− and the CH-PU clamp return |
| 34 | GP28 / ADC2 | PU_PKN | CH-PU negative peak hold (DNP) |
| 35 | ADC_VREF | | not connected |
| 36 | 3V3 (OUT) | 3V3 | logic supply, and 3V3A filter (10 Ω, 10 µF, 100 nF) |
| 37 | 3V3_EN | | not connected |
| 39 | VSYS | VSYS | from the optional isolated module through a 1N5819 (DNP), and J8 |
| 40 | VBUS | VBUS | USB 5 V from the Pico's own connector |

Do not route anything to the Wi-Fi pads (GP23–25, GP29) or the Pico's SWD pads.

## I²C bus (SDA GP4, SCL GP5)

| Device | Address | Side |
|---|---|---|
| ADS1115 module JM1 (CH-R2) | 0x48 (ADDR to GND) | logic |
| ADS1115 module (Phase 4) | 0x4A (ADDR to SDA), later | logic |
| MCP23017 EXP1 | 0x20 (A0–A2 to GND) | logic |
| MCP23017 EXP2 | 0x21 (A0 to 3V3, A1–A2 to GND) | logic |
| ADuM1250, side 1 | | logic |
| ADS1115 module JM2 (CH-TG) | 0x49 (ADDR to 3V3_P) | power, via the isolator |
| MCP4725 ×2 (CH-TG) | 0x60, 0x61 | power, via the isolator |

4.7 kΩ pull-ups to 3V3 on SDA and SCL once on the logic side, and 4.7 kΩ to 3V3_P once on the power side.
Keep the traces short; if the bus misbehaves, drop the speed to 100 kHz.

## MCP23017 expanders (SPDIP-28 narrow or SOIC-28)

Pins: 1–8 GPB0–7, 9 VDD, 10 VSS, 12 SCL, 13 SDA, 15 A0, 16 A1, 17 A2, 18 RESET, 19 INTB, 20 INTA, 21–28 GPA0–7.
VDD to 3V3 with 100 nF, RESET to EXP_RESET (GP20) with a 10 kΩ pull-up to 3V3, INTA optional to EXP_INT.
Every output line has the pull resistor shown (the state when the expander is reset). Firmware pulses `EXP_RESET`
at boot before anything else. Full line list: `docs/pin-budget.md`.

| Line | Net | Pull (safe default) |
|---|---|---|
| EXP1.A0 | PU_RANGE5 | 10 kΩ down |
| EXP1.A1 | PU_RANGE20 | 10 kΩ down |
| EXP1.A2 | PU_RANGE100 | 10 kΩ **up** (least sensitive range) |
| EXP1.A3, A4 | PU_LOAD1, PU_LOAD2 | 10 kΩ down |
| EXP1.A5 | PU_TEST | none (hi-Z) |
| EXP1.A6, A7 | PU_PKRST_P / _N | none (hi-Z) |
| EXP1.B4–B6 | TG_IMP0–2 | 10 kΩ down |
| EXP1.B7 | TG_EN | 10 kΩ down (disabled) |
| EXP2.A0, A1 | R4_EN, INS_EN | 10 kΩ down |
| EXP2.A2, A3 | HV_RANGE0, 1 | R325, R326 10 kΩ **down** (00 = highest range, D23) |
| EXP2.A4 | HV_PKRST | none |
| EXP2.A5 | MID_SENSE (input) | 10 kΩ up |
| EXP2.A6, A7 | R2_CAL1, R2_CAL2 | 10 kΩ down |
| EXP2.B0, B1 | KILL_GND, KILL_HI | 10 kΩ down |

## Connectors (screw terminals 5.08 mm unless noted)

| Ref | Pins | Function |
|---|---|---|
| J1 | 2 | 12 V IN: +12 V, GND_P (feeds F1) |
| J2A (KiCad: J21) | 4 | switch-1 chain: SW1A (2 wires), SW2A (2 wires). A jumper replaces SW2 if there is no E-STOP |
| J2B (KiCad: J22) | 4 | switch-2 chain: SW1B (2 wires), SW2B (2 wires) |
| J3 | 2 | OUT 1: 12V_ARMED through F2 2 A, GND_P. To the CDI POWER + |
| J4 | 2 | OUT 2: spare / aux, F2 2 A, GND_P |
| J5 | 3 | CDI: 1 TRIG+, 2 SHUT DOWN, 3 GND_P (green wires) |
| J6 | 2 | CH-R2: DUT+, DUT− (to AGND) |
| J7 | 2 | CH-PU pickup: IN+, IN− |
| J8 | 2 × 8 header | expansion: 1 3V3, 2 GND_L, 3 SDA, 4 SCL, 5 GP1, 6 GP8, 7 GP9, 8 GP10, 9 GP11, 10 GP12, 11 GP16, 12 GP21, 13 VSYS, 14 GND_L, 15 HV_RANGE0, 16 HV_RANGE1 (D23) |
| JP1 | 1 × 3 header + jumper | 4052 mux VDD: 1 = +5V_P, 3 = +9V_P from U20 (default, jumper on 2–3) |
| J9 | 1 × 4 header | isolated bus, 12 V side (D24): 1 SDA_P, 2 SCL_P, 3 3V3_P, 4 GND_P |
| J10 | 2 × 10 header | expansion 2, logic side (D24): 1 3V3, 2 GND_L, 3 R4_EN, 4 INS_EN, 5 HV_PKRST, 6 ADS1_ALRT, 7 3V3A, 8 ADS1_A3, 9 AGND, 10 GND_L, 11-14 EXP1_B0-B3, 15-20 EXP2_B2-B7 |
| JP2 | 2 single pins | AGND and GND_P, wire or jumper, open by default; closed only for Chain-B (D24) |
| JC1, JC2 | 1 × 3 female | plug-in clamp modules: 1 = 3V3A, 2 = NODE, 3 = GND. JC1 for CH-R2, JC2 for CH-PU. Module = BAT54S |
| JM1, JM2 | 1 × 10 female header | ADS1115 breakout modules (0x48 on the logic side, 0x49 on the 12 V side). Typical pin order: VDD, GND, SCL, SDA, ADDR, ALRT, A0–A3: confirm with the module |
| SW_RST | push button | RUN to GND |

The CDI IGNITION wire goes straight to the ignition coil, not to this board.

## Power and decoupling

- 100 nF at every IC supply pin, as close as possible. 10 µF at the 3V3A filter, the ARM 12V_RAW (470 µF), the charge pump, and each regulator.
- 3V3A = 3V3 through 10 Ω, then 10 µF + 100 nF to AGND.
- 12V_RAW and 12V_ARMED carry up to 5 A: wide traces (about 2.5 mm at 1 oz copper) or pours.

## Test points

3V3, 3V3A, GND_L, GND_P, 12V_RAW, 12V_ARMED, 12V_MID, +5V_P, −5V_P, 3V3_P, V_BIAS, CH-R2 NODE, CH-PU node (after R_S), PU_SIG,
OUT (CH-TG), V_AMP+, V_AMP−, SDA, SCL, SDA_P, SCL_P, MUX_INH. About 22 loops or pads.
Mounting: 4 × M3 holes at the corners.

## Before the PCB order (checks)

- Draw the KiCad schematic from the block pages and this page; run ERC; every pin above is accounted for.
- Compare the Pico pin table against `docs/pin-budget.md` and update `firmware/src/hw_pins.py` when the PCB firmware starts.
- Check footprints against the actual parts (SOIC, VSSOP, SOP-4, TO-220, relay pin spacing, screw terminal pitch).
- Check creepage and the isolation slot.
