# Footprint checklist, ref by ref (from the five sheets, 2026-11-18)

Generated from the footprint fields in `hardware/kicad/mainboard/mainboard-*.kicad_sch` (194 parts).
**Result: every part already has a footprint assigned except F1.** The job in KiCad is to set F1, then check the groups below
(Tools → Assign Footprints, or open each group's footprint in the footprint editor and compare with the datasheet).
Tick a line once its footprint was compared with the datasheet or part, not just the name.

## 1. Missing: set it

- [x] **F1** (ARM): `coiltester:Fuseholder_ESKA_503101` set in the ARM sheet 2026-11-18 (checked in the file).

## 2. Stand-in symbols: footprint is assigned; check pin names against the real part

- [x] **PR1, PR2** (CH-PU): real part AQY210EH, symbol AQY282EH, `DIP-4_W7.62mm`. Pins 1 LED+, 2 LED−, 3 and 4 switch. Pins confirmed against the Panasonic datasheet (order list).
- [x] **PR3, PR4** (CH-R2), **PR5–PR9** (CH-TG): real part AQY212EH, same symbol and footprint. Pins confirmed against the Panasonic datasheet (order list).
- [x] **U401** (CH-PU): real MCP6472-E/MS, symbol MCP6002, `MSOP-8_3x3mm_P0.65mm`. Ordered as MCP6472-E/MS = **MSOP-8** (3 × 3 mm, 0.65 mm pitch; "MS" is MSOP, not SOIC), confirmed 2026-11-18: the footprint is right. Hard to hand-solder: use a fine tip and flux.
- [x] **U402** (CH-PU) 74HC4066D: checked against the NXP datasheet 2026-11-18: SO14, SOT108-1, body width 3.9 mm (narrow), length 8.55-8.75 mm, matches `SOIC-14_3.9x8.7mm_P1.27mm`. Pins 1 1Y, 2 1Z, 3 2Z, 4 2Y, 5 2E, 6 3E, 7 GND, 8 3Y, 9 3Z, 10 4Z, 11 4Y, 12 4E, 13 1E, 14 VCC: the same as the wiring in the sheet.
- [x] **U403** (CH-PU): real MCP6542-I/SN, symbol MCP6562, `SOIC-8_3.9x4.9mm_P1.27mm`. Ordered as MCP6542-I/SN = **SOIC-8** (3.9 mm body, 1.27 mm pitch), confirmed 2026-11-18: the footprint is right.
- [x] **U502** (CH-TG): real MCP1702T-3302E/CB, symbol MCP1700x-330xxTT, `SOT-23`. The symbol pins are 1 GND, 2 VO, 3 VI, which match the MCP1702 SOT-23A pinout from your picture. Pinout confirmed from your picture.

## 3. Pin order can swap: compare with the datasheet picture once

- [x] **Q3** (ARM) 2N7000, `TO-92_Inline`: checked against the Diotec 2N7000 datasheet (Reichelt, version 2011-02-16) on 2026-11-18: drawing shows the pins S, G, D in order = 1 S, 2 G, 3 D, same as the KiCad symbol. Not a BS170.
- [x] **U505** (CH-TG) 78L09 TO-92: checked against the Hottech 78Lxx datasheet 2026-11-18. The package picture lists the pins OUT, GND, IN = 1, 2, 3 (flat face toward you, leads down: OUT is on the left). Reichelt sells the Hottech part, so the sheet value "uA78L09" is the same function. Input max 30 V; the output is guaranteed for Vin 12-24 V, so keep the supply at 12 V or more.
- [x] **U501, U503** (CH-TG) TS78L05ACY, `SOT-89-3`: 1 OUT, 2 GND (tab), 3 IN. Pinout confirmed from your picture.
- [x] **U101–U104** (ARM), **U511–U513** (CH-TG) PC817: **change the footprint in KiCad from `DIP-4_W7.62mm` to `coiltester:DIP-4_in_DIP-6_socket_W7.62mm`** (they go in 6-pin sockets). Pins 1 anode, 2 cathode, 3 emitter, 4 collector (confirmed). DONE 2026-11-18: footprint changed in the sheet files (ARM U101-U104, CH-TG U511-U513).
- [x] **U504** (CH-TG) ICL7660, `DIP-8_W7.62mm`: 1 NC, 2 CAP+, 3 GND, 4 CAP−, 5 VOUT, 6 LV, 7 OSC, 8 V+. Pin list from the ICL7660 DIP-8 pinout; in a socket.
- [x] **U510** (CH-TG) HEF4052BT, `SOIC-16_3.9x9.9mm_P1.27mm`: pinout confirmed 2026-11-17.
- [x] **U404** (CH-PU) MCP4822-E/P, `DIP-8_W7.62mm`; **U507, U508** MCP4725, `SOT-23-6`; **U506** ADuM1250, `SOIC-8`; **U509** TL072, `SOIC-8`: pin orders were confirmed from your pictures.
- [x] **K1** (ARM): `Relay_SPDT_Omron-G5LE-1`, checked against the Omron datasheet 2026-11-17.

## 4. Mechanical: check against the datasheet or part before ordering the board

- [x] **J1, J3, J4, J6, J7** (SPTH 3/2-5,08): checked against the Phoenix datasheet 2026-11-18. Pads match (pitch 5.08, drill 1.3); body is 11.12 × 10 mm vs the footprint's 10.2 × 9.8, so leave 1.5 mm around it. Push-in spring terminal, wire entry toward the board edge.
- [x] **J5** (3-pole): checked against the Phoenix datasheet 2026-11-18 (drill 1.3, 15.16 × 9.85 mm, pitch 5.08): matches. **J21, J22** (4-pole): same family, pitch and depth confirmed by measurement; wire opening toward the board edge.

- [x] **R408, R409** (MBB0207, 350 V): checked 2026-11-18, body 6.5 × 2.5 mm, lead 0.6 mm, spacing 10 mm; fits `R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm` (0.16 mm wider pitch, 0.2 mm longer body). Keep 2 mm clearance.
- [x] **R405** (10k 0.5 W): checked 2026-11-18, body Ø 2.3 × 6.5 mm, lead 0.6 mm; fits `R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm` at the 10.16 mm pitch.
- [x] **R402** (1k 1 W MELF ZCM207): checked 2026-11-18, body 5.8 × Ø 2.2 mm; `R_MELF_MMB-0207` matches the datasheet's pad span (7.0) and width (2.6).
- [x] **C101** (470u, 25 V): checked 2026-11-18, Ø 10 × 16 mm, spacing 5 mm; exact match with `CP_Radial_D10.0mm_P5.00mm` (1.0 mm drill, 2.0 mm pad).
- [x] **C204, C503, C506, C507, C508, C510, C518** (10 µF): changed to `C_0805_2012Metric` in the sheets 2026-11-18 (ordered as 0805). C204 still uses a polarized symbol; optional to swap for `Device:C`.
- [x] **R107** (4.7k, bleeds `12V_ARMED`): changed to `R_0805_2012Metric` and the value text corrected 2026-11-18 (0805, 125 mW; worst case 42 mW).
- [x] **F2, F3** (SMD1812P200TF/16): user-measured body 4.73 × 3.41 mm. `Fuse_1812_4532Metric` has pads 1.125 × 3.4 mm at ±2.1375 mm (outer span 5.4 mm), so each pad sticks out about 0.33 mm beyond the body: fits.
- [x] **SW301** (6 × 6 mm button): user confirmed `SW_PUSH_6mm` is correct for the part, 2026-11-18.
- [x] **Q1, Q2** (IRF4905): checked against the IR datasheet 2026-11-18: TO-220AB, 1 G, 2 D, 3 S, −55 V, 20 mΩ, ±20 V gate.
- [x] **U1** Pico 2 W: `RaspberryPi_Pico_Common_THT` with two 1×20 sockets. Standard Pico footprint, sockets 17.78 mm apart.

## 5. Not on any sheet yet

- Mounting holes (4 × M3), test points TP1…TP22, CH-HV, CH-SP, rig connectors (J8 only), U_ISO (DNP, no part ordered).

## All parts by footprint (regenerated 2026-11-18 from the sheets, after the 0805 changes)

- `Resistor_SMD:R_0805_2012Metric` (90): R101, R102, R103, R104, R105, R106, R107, R108, R109, R110, R111, R112, R113, R114, R115, R201, R202, R203, R204, R205, R206, R207, R208, R209, R210, R301, R302, R303, R310, R311, R312, R313, R314, R315, R316, R317, R318, R319, R320, R321, R322, R323, R324, R325, R326, R403, R406, R407, R410, R411, R412, R413, R414, R415, R416, R417, R418, R419, R420, R501, R502, R503, R504, R505, R506, R507, R508, R509, R510, R511, R512, R513, R514, R515, R516, R517, R518, R519, R520, R521, R522, R523, R524, R525, R526, R527, R528, R529, R530, R531
- `Capacitor_SMD:C_0805_2012Metric` (34): C102, C201, C202, C203, C204, C205, C301, C302, C402, C403, C404, C405, C406, C407, C408, C501, C502, C503, C504, C505, C506, C507, C508, C509, C510, C511, C512, C513, C514, C515, C516, C517, C518, C519
- `Package_DIP:DIP-4_W7.62mm` (9): PR1, PR2, PR3, PR4, PR5, PR6, PR7, PR8, PR9
- `coiltester:DIP-4_in_DIP-6_socket_W7.62mm` (7): U101, U102, U103, U104, U511, U512, U513
- `TerminalBlock_Phoenix:TerminalBlock_Phoenix_MKDS-1,5-2-5.08_1x02_P5.08mm_Horizontal` (5): J1, J3, J4, J6, J7
- `Diode_SMD:D_SMA` (3): D201, D401, D501
- `Package_SO:SOIC-8_3.9x4.9mm_P1.27mm` (3): U403, U506, U509
- `Resistor_THT:R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal` (3): R405, R408, R409
- `Connector_PinSocket_2.54mm:PinSocket_1x10_P2.54mm_Vertical` (2): JM1, JM2
- `Connector_PinHeader_2.54mm:PinHeader_1x01_P2.54mm_Vertical` (2): JP21, JP22
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
- `Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical` (1): J9
- `Connector_PinHeader_2.54mm:PinHeader_2x10_P2.54mm_Vertical` (1): J10
- `Connector_PinHeader_2.54mm:PinHeader_2x08_P2.54mm_Vertical` (1): J8
- `Module:RaspberryPi_Pico_Common_THT` (1): U1
- `Relay_THT:Relay_SPDT_Omron-G5LE-1` (1): K1
- `Capacitor_THT:CP_Radial_D10.0mm_P5.00mm` (1): C101
- `coiltester:Fuseholder_ESKA_503101` (1): F1
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
