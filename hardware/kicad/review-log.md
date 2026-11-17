# KiCad schematic review log

Reviewed together, one point at a time. Source of the points: `review-checklist.md`.
Status: open / ok / fix (needs a change) / fixed.

Order: 1 I/O (done), 2 ARM, 3 CH-R2, 4 CH-PU, 5 CH-TG.

## 1. I/O sheet (`mainboard-io.kicad_sch`)

| # | Point | Status | Answer / correction |
|---|---|---|---|
| 1.1 | Sheet opens, layout readable, no overlapping parts | fixed | Layout fine. User tidied texts and dashed boxes in KiCad, so the .kicad_sch is now hand-edited: never regenerate the I/O sheet. GND_L labels at the bottom of the Pico (7) and the MCP23017 pins 10 pointed up into the body; turned to point down. |
| 1.2 | ERC run, errors fixed | fixed | 0 errors after SW_RST renamed to SW301 and a PWR_FLAG with label VSYS added. Warnings explained below. |

(More points are added as we go.)

### ERC run 1 on the I/O sheet (hardware/kicad/mainboard/ERC.rpt): 2 errors, 60 warnings

| # | ERC item | Count | Verdict |
|---|---|---|---|
| 1.2a | unannotated SW_RST? | 1 error | fixed: SW301 |
| 1.2b | VSYS power input not driven (U1 pin 39) | 1 error | fixed: PWR_FLAG on VSYS |
| 1.2c | label connected to only one pin (VBUS, V_NODE, PU_*, ...) | 37 | expected: the other end of the net is on another sheet; recheck when all sheets are in one project |
| 1.2d | pin off grid (R301, R318, ...) | 20 | harmless (labels sit on the pin ends); ignore |
| 1.2e | lib_symbol_mismatch (Pico W, MCP23017) | 3 | harmless: the generated copy differs slightly from the library; ignore |

### 1.3 Pico pins 1-20 (left side) against docs/pin-budget.md: all match
1 RLY_EN (GP0), 2 GP1_SPARE, 4 PU_POS (GP2), 5 PU_NEG (GP3), 6 SDA (GP4), 7 SCL (GP5), 9 TG_PULSE_A (GP6), 10 TG_PULSE_B (GP7), 11 HV_CMP (GP8), 12 SP_IN (GP9), 14 RIG_PWM (GP10), 15 RIG_TACH (GP11), 16 DRV_OUT (GP12), 17 ARM_SENSE (GP13), 19 R2_DRIVE_1K (GP14), 20 R2_DRIVE_10K (GP15).
Pins 3, 8, 13, 18 (and 23, 28, 38) are all GND. The KiCad symbol draws them as one stacked GND pin, so only pin 3 is visible; this is normal, the PCB footprint still connects all of them.

### 1.4 Pico pins 21-40 (right side) against docs/pin-budget.md: all match
21 GP16_SPARE (GP16), 22 PU_DAC_CS (GP17), 24 SPI0_SCK (GP18), 25 SPI0_MOSI (GP19), 26 EXP_RESET (GP20), 27 EXP_INT (GP21), 29 PWR_EN (GP22), 30 RUN, 31 PU_SIG (GP26), 32 PU_PKP (GP27), 33 AGND, 34 PU_PKN (GP28), 36 3V3, 39 VSYS, 40 VBUS.
35 ADC_VREF and 37 3V3_EN are not connected (no-connect marks): fine. ADC_VREF uses the Pico's internal filtered 3.3 V; 3V3_EN has an internal pull-up. 23, 28, 38 are GND (stacked).
Open note: confirm the labels read SPI0 (letter O, zero) in the file; the answer was typed "SPIO".

### 1.5 U2 (EXP1, 0x20) GPA pins 21-28: all match the pin budget
21 PU_RANGE5 (A0), 22 PU_RANGE20 (A1), 23 PU_RANGE100 (A2), 24 PU_LOAD1 (A3), 25 PU_LOAD2 (A4), 26 PU_TEST (A5), 27 PU_PKRST_P (A6), 28 PU_PKRST_N (A7).

### 1.6 U2 (EXP1) GPB pins 1-8: match
1-4 NC (B0-B3 spare), 5 TG_IMP0, 6 TG_IMP1, 7 TG_IMP2, 8 TG_EN.

### 1.7 U2 (EXP1) power and control pins: match
9 3V3, 10 GND_L, 12 SCL, 13 SDA, 15-17 (A0-A2) GND_L = address 0x20, 18 EXP_RESET, 19 INTB NC, 20 INTA = EXP_INT. Pins 11 and 14 are internal NC pins that the KiCad symbol does not draw.
U2 is finished.

### 1.8 U3 (EXP2, 0x21): GPB and power pins match
1 KILL_GND (B0), 2 KILL_HI (B1), 3-8 NC (spare), 9 3V3, 10 GND_L, 12 SCL, 13 SDA, 15 3V3 (A0 high) and 16-17 GND_L = address 0x21, 19-20 NC (no interrupt used on U3).
Still to check: pin 18 (RESET) and GPA pins 21-28.

### 1.9 U3 (EXP2) pin 18 and GPA 21-28: match
18 EXP_RESET, 21 R4_EN, 22 INS_EN, 23 HV_RANGE0, 24 HV_RANGE1, 25 HV_PKRST, 26 MID_SENSE, 27 R2_CAL1, 28 R2_CAL2. U3 is finished.

### 1.10 Pull resistors R310-R324: match
14 pull-downs to GND_L: PU_RANGE5, PU_RANGE20, PU_LOAD1, PU_LOAD2, TG_IMP0-2, TG_EN, R4_EN, INS_EN, R2_CAL1, R2_CAL2, KILL_GND, KILL_HI. One pull-up to 3V3: PU_RANGE100 (R324), the least sensitive range.
No pull on purpose (high-Z by design): PU_TEST, PU_PKRST_P/N, HV_PKRST, MID_SENSE.
OPEN for CH-HV: HV_RANGE0/1 should default to the highest range (pin budget). Decide the pull directions when the CH-HV divider is designed; no resistors on the I/O sheet yet.

### 1.11 JM1 (ADS1115 0x48, logic side): matches the module order
1 3V3A (user read "3V3": confirm it says 3V3A, the filtered analog supply), 2 AGND, 3 SCL, 4 SDA, 5 GND_L (ADDR to ground = 0x48), 6 ADS1_ALRT, 7 V_NODE (A0), 8 V_TOP1K (A1), 9 V_TOP10K (A2), 10 ADS1_A3_SPARE (A3).
Bench note: many ADS1115 breakouts carry their own 10k I2C pull-ups; they sit in parallel with R301/R302 (4.7k), which is fine.

JM1 pin 1 confirmed 3V3A.

### 1.12 JM2 (ADS1115 0x49, 12 V side): matches except pins 3-4 to confirm
1 3V3_P, 2 GND_P, 3 SCL_P (user read "SCL": must be SCL_P, the isolated segment), 4 SDA_P (same), 5 3V3_P (ADDR high = 0x49), 6 ADS2_ALRT, 7 V_OUT_M, 8 V_AMPP_M, 9 V_AMPN_M, 10 V_ARM_M.

JM2 pins 3 and 4 confirmed SCL_P / SDA_P (isolated segment). JM2 is finished.

### 1.13 J8 expansion header: all 14 pins match (15-16 NC)
Note: J8 pin 13 carries VSYS (the 5 V rail), pins 6-10 are the Pico GP8-GP12 fast lines, pin 12 is EXP_INT.

### 1.14 Bus pull-ups: match
R301 4.7k 3V3-SDA, R302 4.7k 3V3-SCL, R303 10k 3V3-EXP_RESET.

### 1.15 Decoupling and reset button: match
C301, C302 100n 3V3-GND_L; SW301 RUN-GND_L.

## I/O sheet: REVIEW COMPLETE (0 ERC errors). The sheet file is now hand-edited; do not regenerate it.
