# Pin budget for the whole-product PCB (approach accepted 2026-11-16, D13)

Status: proposal for the first PCB. `firmware/src/hw_pins.py` still holds the Phase 1 map that is
running on the bench. It is updated from this table when the PCB firmware is written, and then
`docs/architecture.md` is synced as `CLAUDE.md` requires.

## The problem

The Pico 2 W has 26 usable pins (GP0–22, GP26–28; GP23–25 and GP29 belong to the Wi-Fi chip).
Minus I²C and SPI, about 21 are left. All channels together need about 36 lines: ranges, loads,
relay drives, enables, comparator outputs, pulse outputs.

## The solution

- **Fast or timing-critical lines stay on Pico GPIO** (PIO edge capture, pulse outputs, ADC).
- **Slow static control lines go through two MCP23017 I²C I/O expanders** (16 lines each, DIP-28 or
  SOIC-28, address 0x20 and 0x21): range selects, load selects, relay and photo-relay drives, enables.
- **Safe defaults in hardware.** An MCP23017 resets to all inputs (high-Z), so every control line has a
  pull-up or pull-down that sets the *safe* state: highest range, loads off, outputs off, power stage
  off. The expander `RESET` pin is wired to a Pico GPIO.

## Pico GPIO (fast lines and buses)

| Pin | Signal | Used by |
|---|---|---|
| GP0, GP1 | spare (UART0 debug header) | |
| GP2 | PU_POS: comparator output, positive pulse (PIO) | CH-PU |
| GP3 | PU_NEG: comparator output, negative pulse (PIO) | CH-PU |
| GP4, GP5 | I²C0 SDA, SCL | ADS1115 ×2 (0x48, 0x49), MCP23017 ×2 (0x20, 0x21) |
| GP6 | TG_PULSE_A: trigger pulse to opto A | CH-TG |
| GP7 | TG_PULSE_B: trigger pulse to opto B (bipolar) | CH-TG |
| GP8 | HV_CMP: CDI output comparator (PIO) | CH-HV |
| GP9 | SP_IN: spark detector (PIO) | CH-SP |
| GP10 | RIG_PWM: motor driver | RIG |
| GP11 | RIG_TACH: optical RPM sensor | RIG |
| GP12 | DRV_OUT: coil driver opto | DRV (armed only) |
| GP13 | ARM_SENSE: state of the ARM switch (input) | power stage |
| GP14 | R2_DRIVE_1K | CH-R2 (unchanged) |
| GP15 | R2_DRIVE_10K | CH-R2 (unchanged) |
| GP16 | SPI0 MISO (spare) | |
| GP17 | SPI0 CS for the CH-PU DAC (MCP4822) | CH-PU |
| GP18, GP19 | SPI0 SCK, MOSI | CH-PU DAC |
| GP20 | EXP_RESET: expander reset | |
| GP21 | EXP_INT: expander interrupt (spare use) | |
| GP22 | PWR_EN: firmware permission for the power stage (self-test passed) | power stage |
| GP26 / ADC0 | PU_SIG: buffered pickup waveform | CH-PU |
| GP27 / ADC1 | PU_PKP: positive peak hold (optional, DNP) | CH-PU |
| GP28 / ADC2 | PU_PKN: negative peak hold (optional, DNP) | CH-PU |

## I/O expanders (slow control lines)

| Expander bit | Signal | Safe default (hardware pull) |
|---|---|---|
| EXP1.A0 | PU_RANGE5: ±5 V range switch | off (pull-down) |
| EXP1.A1 | PU_RANGE20: ±20 V range switch | off (pull-down) |
| EXP1.A2 | PU_RANGE100: ±100 V range switch | **on (pull-up)** = least sensitive |
| EXP1.A3 | PU_LOAD1: 1 kΩ load photo-relay | off |
| EXP1.A4 | PU_LOAD2: 10 kΩ load photo-relay | off |
| EXP1.A5 | PU_TEST: self-test injection drive | high-Z (input) |
| EXP1.A6 | PU_PKRST_P: positive peak-hold reset (drive low) | high-Z |
| EXP1.A7 | PU_PKRST_N: negative peak-hold reset (drive high) | high-Z |
| EXP1.B0–B3 | TG_AMP0–3: trigger amplitude bank (photo-relays) | off = lowest amplitude |
| EXP1.B4–B6 | TG_IMP0–2: source-impedance bank | off |
| EXP1.B7 | TG_POL: polarity | off |
| EXP2.A0 | R4_EN: low-ohm current source enable | off |
| EXP2.A1 | INS_EN: insulation HV boost enable | off |
| EXP2.A2, A3 | HV_RANGE0, 1: CDI output divider range | highest range |
| EXP2.A4 | HV_PKRST: HV peak-hold reset | high-Z |
| EXP2.A5–A7, B0–B7 | spare (11 lines) | |

Total slow lines used: 22 of 32. Fast lines used: 25 of 26 (GP0 and GP1 spare).

## Notes

- CH-R2 senses its three voltages on the ADS1115 (decision D8). GP26–28 are therefore free for CH-PU.
- The ARM switch and `PWR_EN` are *both* required to energise the power stage (see D10). The
  hardware ANDs them, so a firmware fault alone cannot turn the stage on.
- Wi-Fi uses GP23–25 and GP29 internally. Do not route anything to those pads.
