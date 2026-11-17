# KiCad schematic review log

Reviewed together, one point at a time. Source of the points: `review-checklist.md`.
Status: open / ok / fix (needs a change) / fixed.

Order: 1 I/O, 2 ARM, 3 CH-R2, 4 CH-PU, 5 CH-TG: all reviewed.

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

## 3. CH-R2 sheet (`mainboard-ch-r2.kicad_sch`)
Hand-edited by the user (layout clean). ERC (ERC-ch-R2.rpt): 0 errors, 22 harmless warnings (off grid, library copy, single labels 3V3 / R2_CAL1 / R2_CAL2 whose other end is on the I/O sheet).

| # | Point | Status | Answer / correction |
|---|---|---|---|
| 3.1 | Reference resistors: R201 1k 0.1% R2_DRIVE_1K-R2_NODE, R202 10k 0.1% R2_DRIVE_10K-R2_NODE; R203 R2_DRIVE_1K-V_TOP1K + C201 100n to AGND; R204 R2_DRIVE_10K-V_TOP10K + C202 100n to AGND | ok | matches |
| 3.2 | Node sense: R205 1k R2_NODE-V_NODE, C203 100n V_NODE-AGND, D201 SMAJ5.0CA R2_NODE-AGND, J6 1 R2_NODE / 2 AGND, JC1 1 3V3A / 2 V_NODE / 3 AGND | ok | matches |
| 3.3 | PR3 self-test (470 ohm): 1 PR3_A, 2 GND_L, 3 R2_NODE, 4 PR3_B; R206 330 R2_CAL1-PR3_A; R207 470 0.1% PR3_B-AGND | ok | matches. LED side GND_L, switch side on the analog node: the photoMOS is the isolation crossing here |
| 3.4 | PR4 self-test (47k): 1 PR4_A, 2 GND_L, 3 R2_NODE, 4 PR4_B; R208 330 R2_CAL2-PR4_A; R209 47k 0.1% PR4_B-AGND | ok | matches |
| 3.5 | Analog supply: R210 10 ohm 3V3-3V3A; C204 10u and C205 100n 3V3A-AGND; NT1 net tie AGND-GND_L | ok | matches. NT1 is the only AGND to GND_L connection on this sheet (JM1 pin 2 and Pico pin 33 are on the AGND net, so the star point is NT1). Open: confirm the 10 uF capacitor package on arrival (footprint-table) |

## CH-R2 sheet: REVIEW COMPLETE (0 ERC errors). Hand-edited: do not regenerate.

## 4. CH-PU sheet (`mainboard-ch-pu.kicad_sch`)
Hand-edited by the user (layout cleaned). Do not regenerate.
ERC (ERC-ch-PU.rpt): first run 9 errors. Fixed: U402 unit D value text made identical to the other units; PWR_FLAG on 3V3A and on AGND (op-amp power pins). Now 6 errors, all "input not driven": U404 SCK / SDI / CS and U402 pins 13, 5, 6 are driven from the I/O sheet (Pico, expanders), which ERC cannot see until the sheets share one project. 14 single-label warnings: same reason.

| # | Point | Status | Answer / correction |
|---|---|---|---|
| 4.1 | Input: J7 1 PU_IN / 2 AGND (IN- is AGND); D401 P4SMAJ120CA PU_IN-AGND; R407 220k PU_TEST-PU_IN | ok | matches |
| 4.2 | PR1 (1k load, AQY210EH 350 V): 1 PR1_A, 2 GND_L, 3 PU_IN, 4 PR1_B; R403 330 PU_LOAD1-PR1_A; R402 1k 1W MELF PR1_B-AGND | ok | matches |
| 4.3 | PR2 (10k load): 1 PR2_A, 2 GND_L, 3 PU_IN, 4 PR2_B; R406 330 PU_LOAD2-PR2_A; R405 10k 0.5W PR2_B-AGND | ok | matches |
| 4.4 | Divider: R408 100k PU_IN-PU_MID, R409 100k PU_MID-PU_N (200k total, axial 0.6 W); R410 84.5k PU_N-PU_L5, R411 16.5k PU_N-PU_L20, R412 3k PU_N-PU_L100 | ok | matches the ordered R_B values (ranges about +-5.05 / +-19.7 / +-101.5 V) |
| 4.5 | U402 4066 switches A/B/C: A 1 PU_L5, 2 V_BIAS, 13 PU_RANGE5; B 4 PU_L20, 3 V_BIAS, 5 PU_RANGE20; C 8 PU_L100, 9 V_BIAS, 6 PU_RANGE100 | ok | matches. Each range leg connects to V_BIAS (1.65 V) when its switch is on |
| 4.6 | U402 unit D (unused) pins 10, 11, 12 AGND; power 14 3V3A, 7 AGND | ok | matches |
| 4.7 | Node sense: R413 1k PU_N-PU_CL; JC2 1 3V3A / 2 PU_CL / 3 AGND; U401B (buffer) 5 PU_CL (+), 6 and 7 PU_BUF (voltage follower); R416 100 PU_BUF-PU_SIG | ok | matches |
| 4.8 | V_BIAS: R414 10k 3V3A-VB_RAW, R415 10k VB_RAW-AGND, C402 1u VB_RAW-AGND; U401A 3 VB_RAW (+), 1 and 2 V_BIAS (follower) | ok | matches. V_BIAS = 1.65 V |
| 4.9 | U401C power: 8 3V3A, 4 AGND. U404 MCP4822: 1 3V3A, 2 PU_DAC_CS, 3 SPI0_SCK, 4 SPI0_MOSI, 5 AGND (LDAC, immediate update), 6 VTHN (VOUTB), 7 AGND, 8 VTHP (VOUTA) | ok | matches the MCP4822 DIP-8 pinout picture |
| 4.10 | Comparators U403 (MCP6542 push-pull): A 3 PU_BUF (+), 2 VTHP (-), 1 PU_POS; B 5 VTHN (+), 6 PU_BUF (-), 7 PU_NEG; C 8 3V3A, 4 AGND | ok | matches. Logic: PU_POS high when signal > VTHP (above bias), PU_NEG high when signal < VTHN (below bias); outputs go to Pico GP2 / GP3 |
| 4.11 | Decoupling C403 (U401), C404 (U402), C405 (U403), C406 (U404): 100n 3V3A-AGND | ok | matches. Place each right next to its chip's supply pin in the layout |
| 4.12 | Peak hold, positive (DNP): D402 BAT54HT1G anode PU_BUF, cathode PU_PKP; C407 10n and R417 10M PU_PKP-AGND; R418 1k PU_PKP-PU_PKRST_P | ok | matches, D402 marked DNP |
| 4.13 | Peak hold, negative (DNP): D403 anode PU_PKN, cathode PU_BUF; C408 10n PU_PKN-AGND; R419 10M PU_PKN-3V3A; R420 1k PU_PKN-PU_PKRST_N | ok | matches, D403 marked DNP |

## CH-PU sheet: REVIEW COMPLETE (6 ERC errors, all "input not driven" from other sheets). Hand-edited: do not regenerate.

## 5. CH-TG sheet (`mainboard-ch-tg.kicad_sch`)
Hand-edited by the user (layout cleaned). Do not regenerate.
ERC (ERC-ch-TG.rpt): first run 6 errors, all "power pin not driven" (12V_RAW, GND_P, 12V_ARMED, 3V3, GND_L, MUX_VDD). Fixed with a PWR_FLAG plus label on each of the six nets. Now 0 errors. Warnings: off grid, library copy, 10 single-label (TG_EN, TG_PULSE_A/B, TG_IMP0-2, KILL_GND/HI, SDA, SCL: other end on the I/O sheet).

| # | Point | Status | Answer / correction |
|---|---|---|---|
| 5.1 | 3V3_P chain: U501 78L05 (SOT-89) 1 5V_RAW, 2 GND_P, 3 12V_RAW; U502 MCP1702 1 GND_P, 2 3V3_P, 3 5V_RAW; C501 100n 12V_RAW-GND_P, C502 1u 5V_RAW-GND_P, C503 10u 3V3_P-GND_P (C504 100n 3V3_P-GND_P to confirm) | ok | matches (pin orders from the user's datasheet pictures) |
| 5.2 | C504 100n 3V3_P-GND_P; U503 78L05 (armed) 1 +5V_P (P5), 2 GND_P, 3 12V_ARMED | ok | matches |
| 5.3 | C505 100n 12V_ARMED-GND_P, C506 10u +5V_P-GND_P; U504 ICL7660: 1 NC, 2 CAP_P, 3 GND_P, 4 CAP_N, 5 -5V_P, 6 NC (LV open, fine for V+ above 3.5 V), 7 NC (oscillator default), 8 +5V_P | ok | matches the ICL7660 DIP-8 pinout |
| 5.4 | C507 10u pump CAP_P-CAP_N; C508 10u GND_P to -5V_P; U505 78L09 (TO-92) 1 +9V_P, 2 GND_P, 3 12V_ARMED; C509 100n 12V_ARMED-GND_P; C510 10u +9V_P-GND_P | ok | matches. Block 1 (supplies) complete |
| 5.5 | U506 ADuM1250: 1 3V3, 2 SDA, 3 SCL, 4 GND_L, 5 GND_P, 6 SCL_P, 7 SDA_P, 8 3V3_P; C511 100n 3V3-GND_L; C512 100n 3V3_P-GND_P; R501/R502 4.7k 3V3_P to SDA_P/SCL_P | ok | matches. The isolation crossing for the bus: logic side 3V3/GND_L, power side 3V3_P/GND_P |
| 5.6 | Dividers: R503 100k OUT-V_OUT_M, R504 33k V_OUT_M-GND_P, R505 56k V_OUT_M-3V3_P; R506 68k V_AMP+ to V_AMPP_M, R507 30k V_AMPP_M-GND_P; R508 150k V_AMP- to V_AMPN_M | ok | matches (R509-R511 to confirm) |
| 5.7 | R509 100k V_AMPN_M-3V3_P, R510 100k 12V_ARMED-V_ARM_M, R511 27k V_ARM_M-GND_P | ok | matches. Block 2 complete. Checked: V_ARM_M = 2.55 V at 12 V, 2.98 V at 14 V (inside the ADS1115 range); V_AMPN_M 0.66-1.98 V for V_AMP- 0 to -3.3 V |
| 5.8 | U507 MCP4725 (0x60): 1 DAC_P, 2 GND_P, 3 3V3_P, 4 SDA_P, 5 SCL_P, 6 GND_P; U508 (0x61): 1 DAC_N, 2 GND_P, 3 3V3_P, 4 SDA_P, 5 SCL_P, 6 3V3_P (A0 high) | ok | matches the MCP4725 SOT-23-6 pinout picture |
| 5.9 | U509 TL072: A 3 DAC_P (+), 2 TG_FBP (-), 1 V_AMP+; B 5 GND_P (+), 6 TG_FBN (-), 7 V_AMP-; C 8 12V_ARMED, 4 -5V_P | ok | matches. A = non-inverting gain 3, B = inverting gain -1 |
| 5.10 | R512 10k TG_FBP-GND_P, R513 20k TG_FBP-V_AMP+ (gain 3); R514 10k DAC_N-TG_FBN, R515 10k TG_FBN-V_AMP- (gain -1); C513/C514 100n 3V3_P-GND_P, C515 100n 12V_ARMED-GND_P, C516 100n GND_P-(-5V_P) | ok | matches. Block 3 complete |
| 5.11 | U510 4052 signal pins: 11 GND_P (X3), 12 GND_P (X0), 13 TG_S (common X), 14 V_AMP- (X1), 15 V_AMP+ (X2) | ok | matches. Truth table checked (B A): idle 11 = X3 = GND; pulse A on = MUX_A low, MUX_B high = 10 = X2 = V_AMP+; pulse B on = 01 = X1 = V_AMP- |
| 5.12 | U510 control/power: 9 MUX_B, 10 MUX_A, 6 MUX_INH, 7 -5V_P (VEE), 8 GND_P, 16 MUX_VDD; unused pins 1-5 GND_P | ok | matches. Open: pin numbers match the 74HC4052/CD4052B SOIC-16 pinout; verify against the datasheet of the part actually bought (HEF4052BT) |
| 5.13 | JP1: 1 +5V_P, 2 MUX_VDD, 3 +9V_P (jumper 2-3 = +9V_P default); C517 100n, C518 10u MUX_VDD-GND_P; C519 100n GND_P to -5V_P | ok | matches. Supply range: VDD 9 V and VEE -5 V = 14 V total (4052 max 15.5 V); control inputs reference VSS = GND_P. Block 4 complete |
| 5.14 | U511 (pulse A): 1 U511_A, 2 GND_L, 3 GND_P, 4 MUX_A; R516 330 TG_PULSE_A-U511_A; R517 4.7k MUX_VDD-MUX_A | ok | matches. Isolation crossing |
| 5.15 | U512 (pulse B): 1 U512_A, 2 GND_L, 3 GND_P, 4 MUX_B; U513 (enable): 1 U513_A, 2 GND_L, 3 GND_P, 4 MUX_INH; R518 330 TG_PULSE_B-U512_A, R519 4.7k MUX_VDD-MUX_B, R520 330 TG_EN-U513_A, R521 4.7k MUX_VDD-MUX_INH | ok | matches. TG_EN low (default, pulled down): LED off, MUX_INH high = mux disabled. Block 5 complete |
| 5.16 | PR5/PR6/PR7 (source impedance): each 1 PRn_A, 2 GND_L, 3 TG_S, 4 PRn_B | ok | matches |
| 5.17 | Source impedance: R522 100 PR5_B-OUT, R524 470 PR6_B-OUT, R526 2.2k PR7_B-OUT; LED resistors R523/R525/R527 330 from TG_IMP0/1/2 to PRn_A | ok | matches |
| 5.18 | Kill outputs: PR8 1 PR8_A, 2 GND_L, 3 SHUT, 4 PR8_B; PR9 1 PR9_A, 2 GND_L, 3 SHUT, 4 PR9_B; R528 100 PR8_B-GND_P, R529 330 KILL_GND-PR8_A; R530 1k PR9_B-12V_ARMED, R531 330 KILL_HI-PR9_A | ok | matches |
| 5.19 | J5 CDI: 1 OUT (TRIG+), 2 SHUT, 3 GND_P; D501 P4SMAJ15CA OUT-GND_P | ok | matches. Block 6 complete |

## CH-TG sheet: REVIEW COMPLETE (0 ERC errors after the six PWR_FLAGs). Hand-edited: do not regenerate.

# Summary of the review (all five sheets)
- I/O, ARM, CH-R2, CH-PU, CH-TG: every net compared point by point with the block pages / pin budget; no wiring errors found. Fixes were cosmetic or ERC-related (labels, references J21/J22 and SW301, PWR_FLAGs, a unit value text).
- Open items carried to the next phase:
  1. F1 fuse-holder footprint (measure ESKA 503101 clips on arrival), SPTH terminal blocks, Omron G5LE-1, 10 uF capacitor package, Pico socket holes.
  2. CH-HV: HV_RANGE0/1 pull directions (highest range by default).
  3. 4052 pin numbers against the datasheet of the HEF4052BT actually bought.
  4. Isolated 12 V to 5 V module and VSYS diode, CH-SP, rig connectors: not on any sheet yet.
  5. Once all five sheets are in one project, re-run ERC (the single-label and "input not driven" items should disappear).
  6. Stand-in symbols (AQY282EH, MCP6002, MCP6562, HEF4066BT, MCP1700): values hold the real parts; footprints are what matter for the PCB.

# Whole-project ERC (ERC-Main.rpt, all five sheets in the root)
First run: 6 errors, 124 warnings.
- 7 single-label warnings, exactly the expected set: VBUS, HV_RANGE0/1, HV_PKRST, ADS1_ALRT, ADS2_ALRT, ADS1_A3_SPARE. All the "input not driven" errors and the 30-odd cross-sheet single labels are gone: the sheets are connected.
- 3 errors "power output to power output": the PWR_FLAGs I asked for on AGND (CH-PU), 3V3 and GND_L (CH-TG) clash with the Pico's own power-output pins (AGND pin 33, 3V3 pin 36, GND). Fix: delete those three flags (the Pico drives those nets now).
- 3 errors "duplicate reference" #FLG01 / #FLG02: PWR_FLAGs on different sheets got the same hidden reference. Fix: annotate (keep existing).
- 101 off-grid and 16 library-copy warnings: harmless.
- Annotate "keep existing" cannot fix duplicate power-flag numbers. Fixed in the files: CH-PU flag renumbered #FLG11, I/O flag #FLG21 (CH-TG keeps #FLG01/02/03/06). The three flag clashes were removed in KiCad (3V3 and GND_L on CH-TG, AGND on CH-PU).
