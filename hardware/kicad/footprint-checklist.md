# Footprint checklist, ref by ref (from the five sheets, 2026-11-18)

Generated from the footprint fields in `hardware/kicad/mainboard/mainboard-*.kicad_sch` (194 parts).
**Result: every part already has a footprint assigned except F1.** The job in KiCad is to set F1, then check the groups below
(Tools → Assign Footprints, or open each group's footprint in the footprint editor and compare with the datasheet).
Tick a line once its footprint was compared with the datasheet or part, not just the name.

## 1. Missing: set it

- [ ] **F1** (ARM): `coiltester:Fuseholder_ESKA_503101` (project library `coiltester`, loaded through `mainboard/fp-lib-table`)

## 2. Stand-in symbols: footprint is assigned; check pin names against the real part

- [ ] **PR1, PR2** (CH-PU): real part AQY210EH, symbol AQY282EH, `DIP-4_W7.62mm`. Pins 1 LED+, 2 LED−, 3 and 4 switch.
- [ ] **PR3, PR4** (CH-R2), **PR5–PR9** (CH-TG): real part AQY212EH, same symbol and footprint.
- [ ] **U401** (CH-PU): real MCP6472-E/MS, symbol MCP6002, `MSOP-8_3x3mm_P0.65mm`.
- [ ] **U402** (CH-PU): real 74HC4066 SO-14, symbol HEF4066BT, `SOIC-14_3.9x8.7mm_P1.27mm`.
- [ ] **U403** (CH-PU): real MCP6542-I/SN, symbol MCP6562, `SOIC-8_3.9x4.9mm_P1.27mm`.
- [ ] **U502** (CH-TG): real MCP1702T-3302E/CB, symbol MCP1700x-330xxTT, `SOT-23`. The symbol pins are 1 GND, 2 VO, 3 VI, which match the MCP1702 SOT-23A pinout from your picture.

## 3. Pin order can swap: compare with the datasheet picture once

- [ ] **Q3** (ARM) 2N7000, `TO-92_Inline`: 1 S, 2 G, 3 D (not a BS170).
- [ ] **U505** (CH-TG) 78L09 TO-92: 1 OUT, 2 GND, 3 IN. Check the flat side against the drawing.
- [ ] **U501, U503** (CH-TG) TS78L05ACY, `SOT-89-3`: 1 OUT, 2 GND (tab), 3 IN.
- [ ] **U101–U104** (ARM), **U511–U513** (CH-TG) PC817, `DIP-4_W7.62mm`: 1 anode, 2 cathode, 3 emitter, 4 collector.
- [ ] **U504** (CH-TG) ICL7660, `DIP-8_W7.62mm`: 1 NC, 2 CAP+, 3 GND, 4 CAP−, 5 VOUT, 6 LV, 7 OSC, 8 V+.
- [ ] **U510** (CH-TG) HEF4052BT, `SOIC-16_3.9x9.9mm_P1.27mm`: pinout confirmed 2026-11-17.
- [ ] **U404** (CH-PU) MCP4822-E/P, `DIP-8_W7.62mm`; **U507, U508** MCP4725, `SOT-23-6`; **U506** ADuM1250, `SOIC-8`; **U509** TL072, `SOIC-8`: pin orders were confirmed from your pictures.
- [ ] **K1** (ARM): `Relay_SPDT_Omron-G5LE-1`, checked against the Omron datasheet 2026-11-17.

## 4. Mechanical: check against the datasheet or part before ordering the board

- [x] **J1, J3, J4, J6, J7** (SPTH 3/2-5,08): checked against the Phoenix datasheet 2026-11-18. Pads match (pitch 5.08, drill 1.3); body is 11.12 × 10 mm vs the footprint's 10.2 × 9.8, so leave 1.5 mm around it. Push-in spring terminal, wire entry toward the board edge.
- [x] **J5** (3-pole): checked against the Phoenix datasheet 2026-11-18 (drill 1.3, 15.16 × 9.85 mm, pitch 5.08): matches. **J21, J22** (4-pole): same family, pitch and depth confirmed by measurement; wire opening toward the board edge.

- [x] **R408, R409** (MBB0207, 350 V): checked 2026-11-18, body 6.5 × 2.5 mm, lead 0.6 mm, spacing 10 mm; fits `R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm` (0.16 mm wider pitch, 0.2 mm longer body). Keep 2 mm clearance.
- [x] **R405** (10k 0.5 W): checked 2026-11-18, body Ø 2.3 × 6.5 mm, lead 0.6 mm; fits `R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm` at the 10.16 mm pitch.
- [x] **R402** (1k 1 W MELF ZCM207): checked 2026-11-18, body 5.8 × Ø 2.2 mm; `R_MELF_MMB-0207` matches the datasheet's pad span (7.0) and width (2.6).
- [x] **C101** (470u, 25 V): checked 2026-11-18, Ø 10 × 16 mm, spacing 5 mm; exact match with `CP_Radial_D10.0mm_P5.00mm` (1.0 mm drill, 2.0 mm pad).
- [ ] **C204, C503, C506, C507, C508, C510, C518** (10 µF): **change from `C_1206_3216Metric` to `C_0805_2012Metric` in KiCad** (ordered as 0805, KEMET X7R 16 V). C204 also uses a polarized symbol; a ceramic has no polarity, so swap it for `Device:C` if you want the symbol to match.
- [ ] **R107** (4.7k, bleeds `12V_ARMED`): **change from `R_1206_3216Metric` to `R_0805_2012Metric` in KiCad**: all the 4.7k you bought are 0805, 125 mW. The load is 14 V² / 4.7k = 42 mW at the worst case (14 V supply), about a third of the rating, so 0805 is fine. Also fix the value text on the ARM sheet (it says 0.5W).
- [ ] **F2, F3**: `Fuse_1812_4532Metric` (SMD1812P200TF/16).
- [ ] **U1** Pico 2 W: `RaspberryPi_Pico_Common_THT` with two 1×20 sockets.

## 5. Not on any sheet yet

- Mounting holes (4 × M3), test points TP1…TP22, CH-HV, CH-SP, rig connectors (J8 only), U_ISO (DNP, no part ordered).

## All parts by footprint

- `Resistor_SMD:R_0805_2012Metric` (89): R101, R102, R103, R104, R105, R106, R108, R109, R110, R111, R112, R113, R114, R115, R201, R202, R203, R204, R205, R206, R207, R208, R209, R210, R301, R302, R303, R310, R311, R312, R313, R314, R315, R316, R317, R318, R319, R320, R321, R322, R323, R324, R325, R326, R403, R406, R407, R410, R411, R412, R413, R414, R415, R416, R417, R418, R419, R420, R501, R502, R503, R504, R505, R506, R507, R508, R509, R510, R511, R512, R513, R514, R515, R516, R517, R518, R519, R520, R521, R522, R523, R524, R525, R526, R527, R528, R529, R530, R531
- `Capacitor_SMD:C_0805_2012Metric` (27): C102, C201, C202, C203, C205, C301, C302, C402, C403, C404, C405, C406, C407, C408, C501, C502, C504, C505, C509, C511, C512, C513, C514, C515, C516, C517, C519
- `Package_DIP:DIP-4_W7.62mm` (16): PR1, PR2, PR3, PR4, PR5, PR6, PR7, PR8, PR9, U101, U102, U103, U104, U511, U512, U513
- `Capacitor_SMD:C_1206_3216Metric` (7): C204, C503, C506, C507, C508, C510, C518
- `TerminalBlock_Phoenix:TerminalBlock_Phoenix_MKDS-1,5-2-5.08_1x02_P5.08mm_Horizontal` (5): J1, J3, J4, J6, J7
- `Diode_SMD:D_SMA` (3): D201, D401, D501
- `Package_SO:SOIC-8_3.9x4.9mm_P1.27mm` (3): U403, U506, U509
- `Resistor_THT:R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal` (3): R405, R408, R409
- `Connector_PinSocket_2.54mm:PinSocket_1x10_P2.54mm_Vertical` (2): JM1, JM2
- `Package_DIP:DIP-28_W7.62mm` (2): U2, U3
- `Package_TO_SOT_THT:TO-220-3_Vertical` (2): Q1, Q2
- `TerminalBlock_Phoenix:TerminalBlock_Phoenix_MKDS-1,5-4-5.08_1x04_P5.08mm_Horizontal` (2): J21, J22
- `LED_THT:LED_D3.0mm` (2): LED101, LED102
- `Fuse:Fuse_1812_4532Metric` (2): F2, F3
- `Package_TO_SOT_THT:TO-92_Inline` (2): Q3, U505
- `Connector_PinSocket_2.54mm:PinSocket_1x03_P2.54mm_Vertical` (2): JC1, JC2
- `Diode_SMD:D_SOD-323` (2): D402 (DNP), D403 (DNP)
- `Package_DIP:DIP-8_W7.62mm` (2): U404, U504
- `Package_TO_SOT_SMD:SOT-23-6` (2): U507, U508
- `Package_TO_SOT_SMD:SOT-89-3` (2): U501, U503
- `Button_Switch_THT:SW_PUSH_6mm` (1): SW301
- `Connector_PinHeader_2.54mm:PinHeader_2x08_P2.54mm_Vertical` (1): J8
- `Module:RaspberryPi_Pico_Common_THT` (1): U1
- `Resistor_SMD:R_1206_3216Metric` (1): R107
- `Relay_THT:Relay_SPDT_Omron-G5LE-1` (1): K1
- `Capacitor_THT:CP_Radial_D10.0mm_P5.00mm` (1): C101
- `(none)` (1): F1
- `Diode_SMD:D_SMB` (1): D101
- `Diode_THT:D_DO-41_SOD81_P10.16mm_Horizontal` (1): D102
- `NetTie:NetTie-2_SMD_Pad0.5mm` (1): NT1
- `Package_SO:SOIC-14_3.9x8.7mm_P1.27mm` (1): U402
- `Package_SO:MSOP-8_3x3mm_P0.65mm` (1): U401
- `Resistor_SMD:R_MELF_MMB-0207` (1): R402
- `Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical` (1): JP1
- `Package_SO:SOIC-16_3.9x9.9mm_P1.27mm` (1): U510
- `TerminalBlock_Phoenix:TerminalBlock_Phoenix_MKDS-1,5-3-5.08_1x03_P5.08mm_Horizontal` (1): J5
- `Package_TO_SOT_SMD:SOT-23` (1): U502
