# KiCad schematic review log

Reviewed together, one point at a time. Source of the points: `review-checklist.md`.
Status: open / ok / fix (needs a change) / fixed.

Order: 1 I/O (done), 2 ARM (done), 3 CH-R2, 4 CH-PU, 5 CH-TG.

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

## 2. ARM sheet (`mainboard-arm.kicad_sch`)
The sheet is hand-edited (user cleaned texts, boxes, titles): never regenerate it.

| # | Point | Status | Answer / correction |
|---|---|---|---|
| 2.1 | Layout, overlaps, title and boxes off page | fixed | cleaned by the user in KiCad |
| 2.2 | ERC | fixed | first run 1 error (J2A unannotated), 38 harmless warnings. J2A/J2B renamed J21/J22 (KiCad needs a numeric suffix); docs and footprint table updated. ERC now 0 errors. The drawio diagram and the BOM sheet keep the old names J2A/J2B. |
| 2.3 | J1 (1 12V_IN, 2 GND_P), F1 (12V_IN to IN_FUSED) | ok | matches |
| 2.4 | Q1 reverse protection: G=Q1_G, D=IN_FUSED, S=12V_RAW, R101 10k Q1_G to GND_P | ok | P-FET with drain at the input: body diode conducts for correct polarity, gate pulled low turns it fully on; reversed input leaves Vgs = 0 so it blocks |
| 2.5 | 12V_RAW parts: C101 470u, C102 100n, D101 SM6T18CA (all 12V_RAW to GND_P), R108 2.2k + LED101 green | ok | matches. D101 stand-off 15.3 V: supply must stay at 14 V or below |
| 2.6 | Switch 1: Q2 G=Q2_G, D=12V_MID, S=12V_RAW; R102 10k 12V_RAW-Q2_G; R103 2.2k Q2_G-ARM_A1 | ok | matches. Gate divider gives Vgs about -9.8 V when the chain conducts (IRF4905 fully on); with the chain open R102 holds Vgs = 0 = off |
| 2.7 | Gate chain: J21 pins 1 ARM_A1, 2 ARM_A2, 3 ARM_A2, 4 ARM_A3 (jumper 3-4 if no SW2A); U101 pin 4 ARM_A3, pin 1 U101_A | ok | matches. R110 330 is the LED series resistor (PWR_EN to U101_A), R111 10k pulls PWR_EN low (not a divider). U101 pin 2 = GND_L, pin 3 = GND_P confirmed (the isolation crossing) |
| 2.8 | Relay K1 pins: 1 12V_MID (COM), 3 12V_ARMED (NO), 2 RLY_COIL_N, 5 RLY_COIL_P, 4 NC | ok | matches the Omron G5LE datasheet (SPDT, bottom view): coil 2 and 5, COM 1, NO 3, NC 4. Confirmed by the user against the datasheet. Closes the open relay-pin item. |
| 2.9 | D102 flyback: anode RLY_COIL_N, cathode RLY_COIL_P; Q3 pin 3 (D) = RLY_COIL_N; R104 10k Q3_G to GND_P | ok | matches. 2N7000 TO-92 pinout 1 S, 2 G, 3 D confirmed in the symbol; the real device must be the onsemi/Fairchild 2N7000 (1 S, 2 G, 3 D), not a BS170 (D-G-S). Q3 pin 1 GND_P, pin 2 Q3_G confirmed |
| 2.10 | U102 (relay optocoupler): 1 U102_A, 2 GND_L, 3 Q3_G, 4 12V_RAW | ok | matches. RLY_EN high: LED about 6 mA, transistor saturates, Q3 gate at about 11.8 V (2N7000 max 20 V), R104 holds it low otherwise |
| 2.11 | Coil enable chain: J22 1 12V_RAW, 2-3 ARM_B2 (jumper if no SW2B), 4 RLY_COIL_P; R112 330 RLY_EN to U102_A; R113 10k RLY_EN to GND_L | ok | matches. The relay coil only gets power through SW1B and SW2B (hardware path independent of firmware) |
| 2.12 | Output side: R107 4.7k 12V_ARMED-GND_P (bleeds the rail), R109 2.2k + LED102 red ARMED (anode toward 12V_ARMED, cathode GND_P), F2 12V_ARMED-OUT1, F3 12V_ARMED-OUT2 | ok | matches |
| 2.13 | Outputs: J3 1 OUT1 / 2 GND_P, J4 1 OUT2 / 2 GND_P | ok | matches |
| 2.14 | U103 MID_SENSE: 1 U103_A, 2 GND_P, 3 GND_L, 4 MID_SENSE; R105 3.3k 12V_MID-U103_A; R114 10k 3V3-MID_SENSE | ok | matches. LED about 3 mA at 12 V; low on MID_SENSE = 12V_MID live |
| 2.15 | U104 ARM_SENSE: 1 U104_A, 2 GND_P, 3 GND_L, 4 ARM_SENSE; R106 3.3k 12V_ARMED-U104_A; R115 10k 3V3-ARM_SENSE | ok | matches. Weld check: ARM_SENSE reads the real output rail, MID_SENSE reads the node before the relay |

## ARM sheet: REVIEW COMPLETE (0 ERC errors). Hand-edited: do not regenerate.
Open item carried forward: F1 footprint empty until the ESKA 503101 clips are measured (PCB layout phase).
