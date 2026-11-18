# Footprint table for the mainboard (KiCad 10)

Footprint names are from the standard KiCad library. They were written from the parts in `hardware/bom-order-list.xlsx`
(after the user's Reichelt check, 2026-11-16). The KiCad libraries are on the user's host, not in the container, so a
name may differ slightly in the library: search the library for the base name. **Pin-order warnings** are marked ⚠.
"Measure" means: compare the footprint with the real part when it arrives, before the PCB order.

Rule: use KiCad's own symbol AND its default footprint where one exists. The symbol pin numbers then match the footprint.
Check each package against the datasheet picture once, not only the name.

## ICs and modules

| Ref | Part | Footprint | Notes |
|---|---|---|---|
| U1 | Pico 2 W in 2 × 1×20 sockets | `Module:RaspberryPi_Pico_Common_THT` (symbol default) | Solder the 1×20 sockets into its holes. Rows 17.78 mm apart. Measure: hole drill fits the socket pins. |
| U2, U3 (EXP) | MCP23017-E/SP + DIP-28 socket | `Package_DIP:DIP-28_W7.62mm` (+ socket) | Narrow (0.3") body. |
| JM1, JM2 | ADS1115 module, 1×10 female | `Connector_PinSocket_2.54mm:PinSocket_1x10_P2.54mm_Vertical` | User confirmed the pin order VDD, GND, SCL, SDA, ADDR, ALRT, A0–A3. |
| CH-PU U1 | MCP6472-E/MS | `Package_SO:MSOP-8_3x3mm_P0.65mm` | Same pin order as the MCP6002 (1 OUTA, 2 INA−, 3 INA+, 4 VSS, 5 INB+, 6 INB−, 7 OUTB, 8 VDD). |
| CH-PU U2 | 74HC4066 (SO-14) | `Package_SO:SOIC-14_3.9x8.7mm_P1.27mm` | Pin 7 = GND, 14 = VCC. |
| CH-PU U3 | MCP6542-I/SN | `Package_SO:SOIC-8_3.9x4.9mm_P1.27mm` | 1 OUTA, 2 INA−, 3 INA+, 4 VSS, 5 INB+, 6 INB−, 7 OUTB, 8 VDD. Push-pull output. |
| CH-PU U4 | MCP4822-E/P | `Package_DIP:DIP-8_W7.62mm` | Confirmed from the user's picture (`hardware/MCP4822-dip8-piout.png`): 1 VDD, 2 CS, 3 SCK, 4 SDI, 5 LDAC, 6 VOUTB, 7 VSS, 8 VOUTA. |
| U_ISO | none ordered (DNP) | no footprint yet | Optional stand-alone supply, D22. Pick the part and draw its footprint only if it is ever fitted. |
| U14 | ADuM1250ARZ | `Package_SO:SOIC-8_3.9x4.9mm_P1.27mm` | Confirmed from the user's picture (`hardware/ADuM1250-piout.png`): 1 VDD1, 2 SDA1, 3 SCL1, 4 GND1, 5 GND2, 6 SCL2, 7 SDA2, 8 VDD2. |
| U16, U17 | MCP4725A0T-E/CH | `Package_TO_SOT_SMD:SOT-23-6` | Confirmed from the user's picture (`hardware/MCP4725-SOT23-6-pinout.png`): 1 VOUT, 2 VSS, 3 VDD, 4 SDA, 5 SCL, 6 A0. |
| U18 | TL072CD | `Package_SO:SOIC-8_3.9x4.9mm_P1.27mm` | Pin 4 V−, 8 V+. |
| U19 | 4052 (SO-16) | `Package_SO:SOIC-16_3.9x9.9mm_P1.27mm` | Pin 7 VEE, 8 VSS (GND), 16 VDD, 6 INH. |
| U13 | ICL7660SCPA + DIP-8 socket | `Package_DIP:DIP-8_W7.62mm` | 1 BOOST, 2 CAP+, 3 GND, 4 CAP−, 5 VOUT, 6 LV, 7 OSC, 8 V+. |
| U10, U12 | TS78L05ACY (SOT-89) | `Package_TO_SOT_SMD:SOT-89-3` | Pinout confirmed from the user's picture (`hardware/TS78L05ACY-sot89-pinout.png`): 1 OUT, 2 GND (also the tab), 3 IN. Use `Regulator_Linear:L78L05_SOT89` and compare its pin numbers with this. |
| U20 | µA78L09 (TO-92) | `Package_TO_SOT_THT:TO-92_Inline` | From the user's picture (`hardware/78L09-TO92-piout.png`): OUT, GND, IN in that order = pins 1, 2, 3 (the picture is a 3D view: check the flat side against the datasheet drawing once). Not the same as the 2N7000 (S, G, D). |
| U11 | MCP1702T-3302E/CB (SOT-23A) | `Package_TO_SOT_SMD:SOT-23` | Pinout confirmed from the user's picture (`hardware/mcp1702-sot-23a-pinout.png`): 1 GND, 2 VOUT, 3 VIN. Use KiCad's `Regulator_Linear:MCP1702-3302_SOT23` and check its pin names against this. Needs 1 µF ceramic on input and output. |
| PR1, PR2 | AQY210EH | `Package_DIP:DIP-4_W7.62mm` | 1 LED anode, 2 LED cathode, 3 and 4 switch. Same pins as the PC817 except for what the pins mean. |
| PR3–PR9 | AQY212EH | `Package_DIP:DIP-4_W7.62mm` | Same. The two switch pins straddle the isolation slot where needed. |
| opto (7) | PC817X1NSZ1B | `Package_DIP:DIP-4_W7.62mm` | ⚠ 1 anode, 2 cathode, 3 emitter, 4 collector. |
| K1 | Omron G5LE-1 DC12 | `Relay_THT:Relay_SPDT_Omron-G5LE-1` | ✔ Checked against the Omron G5LE datasheet (2026-11-17): the stock footprint matches. Pads (top view, mm, pin 1 at 0,0): 2 (−6, 2), 5 (6, 2), 3 (−6, 14.2), 4 (6, 14.2); drill 1.3 (datasheet: 1.3 dia., ±0.1), pad 2.5. Coil pins 12.0 apart, 2.0 from COM; contacts 12.2 from the coil pins. Body 22.5 × 16.5 × 19 max. Pin numbers: 1 COM, 2/5 coil, 3 NO, 4 NC. Only a quick fit check on the real relay remains. |

## Transistors, diodes, protection

| Ref | Part | Footprint | Notes |
|---|---|---|---|
| Q1, Q2 | IRF4905 | `Package_TO_SOT_THT:TO-220-3_Vertical` | Pins 1 G, 2 D, 3 S. |
| Q3 | 2N7000 | `Package_TO_SOT_THT:TO-92_Inline` | ⚠ 1 S, 2 G, 3 D (BS170 is different). Run ERC against the KiCad symbol. |
| D6 | 1N4007 | `Diode_THT:D_DO-41_SOD81_P10.16mm_Horizontal` | Cathode (band) at the +12 V side of the coil. |
| D2, D3 modules | BAT54S-7-F | `Package_TO_SOT_SMD:SOT-23` | Pin order confirmed by the user. |
| D4, D5 | BAT54HT1G | `Diode_SMD:D_SOD-323` | Cathode = bar. |
| D7 | SMAJ5.0CA | `Diode_SMD:D_SMA` | Bidirectional: no polarity. |
| D1 (PU) | P4SMAJ120CA | `Diode_SMD:D_SMA` | Bidirectional. |
| D8 | P4SMAJ15CA | `Diode_SMD:D_SMA` | Bidirectional. |
| D1 (ARM) | SM6T18CA | `Diode_SMD:D_SMB` | Bidirectional. |
| D_VSYS | 1N5819 (DNP) | `Diode_THT:D_DO-41_SOD81_P10.16mm_Horizontal` | Band (cathode) toward VSYS. Optional stand-alone supply, D22. |
| F1 | ESKA 503101, 5 × 20 fuse | clip holder ×2, footprint to be drawn | ⚠ The ESKA catalogue (page 16, 503.000/.100/.200/.600) gives: 503.101 = white, solder **pin** (bottom); pitch between the clips **22.5 mm**; body 28.2 × 8.0 mm; 250 V, 6.3 A; brass, tinned. It has **no** pin diameter, drill size or pin offset. **Measure the pin diameter and the pin position across the 8 mm width when it arrives**, then draw the custom footprint. Provisional: two pads 22.5 mm apart, centred on the width, 1.5 mm drill (verify before ordering). |
| F2 ×2 | SMD1812P200TF/16 | `Fuse:Fuse_1812_4532Metric` | |

## Passives and connectors

| Ref | Part | Footprint | Notes |
|---|---|---|---|
| R (SMD) | 0805 resistors | `Resistor_SMD:R_0805_2012Metric` | |
| C (SMD) | 0805 capacitors | `Capacitor_SMD:C_0805_2012Metric` | The 10 µF: use `C_1206_3216Metric` if the ones in the cart are 1206 (check). |
| R_T1, R_T2 | Vishay MBB0207, 100 kΩ | `Resistor_THT:R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal` | Rated 350 V. Leave extra clearance (2 mm) to other copper. |
| R_L1 | VIT ZC207 1k MELF | `Resistor_SMD:R_MELF_MMB-0207` | |
| R_L2 | METALL 10k | `Resistor_THT:R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal` | |
| C1 | WL1E477M10016100 | `Capacitor_THT:CP_Radial_D10.0mm_P5.00mm` | Stripe = −. |
| J1, J3, J4, J6, J7 | SPTH 3 2 5.08 | `TerminalBlock_Phoenix:TerminalBlock_Phoenix_MKDS-1,5-2-5.08_1x02_P5.08mm_Horizontal` | ⚠ The 2-pole is the larger "SPTH 3" family (up to 4 mm²): measure its pin diameter and housing against the footprint. |
| J5 | SPTH 1.5 3 5.08 | `…MKDS-1,5-3-5.08_1x03_P5.08mm_Horizontal` | Measure. |
| J21, J22 | SPTH 1.5 4 5.08 | `…MKDS-1,5-4-5.08_1x04_P5.08mm_Horizontal` | Measure. |
| J8 | 2 × 8 header | `Connector_PinHeader_2.54mm:PinHeader_2x08_P2.54mm_Vertical` | |
| JP1 | 1 × 3 header | `Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical` | |
| JC1, JC2 | 1 × 3 female | `Connector_PinSocket_2.54mm:PinSocket_1x03_P2.54mm_Vertical` | |
| SW_RST | 6 × 6 mm button | `Button_Switch_THT:SW_PUSH_6mm` | |
| TP1…TP22 | pin or wire | `Connector_PinHeader_2.54mm:PinHeader_1x01_P2.54mm_Vertical` | 1.0 mm hole fits a header pin or a bent wire up to about 0.8 mm. |
| mounting | M3 holes | `MountingHole:MountingHole_3.2mm_M3_Pad` (or no pad) | 4 corners. |
| LEDs | 3 mm | `LED_THT:LED_D3.0mm` | Cathode (flat side) marked. |

## To measure when the parts arrive (before layout is final)

1. ESKA fuse clips: pin diameter, drill and pin offset across the width (pitch 22.5 mm is from the datasheet).
2. SPTH terminal blocks: pin diameter, pin spacing, housing width.
3. Omron G5LE-1: fit check on the real relay (the stock footprint already matches the datasheet).
4. The 10 µF capacitor package (0805 or 1206).
5. Pico socket pins: fit in the Pico footprint holes.
