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
| F1 | ESKA 503101, 5 × 20 fuse | `coiltester:Fuseholder_ESKA_503101` (custom, `hardware/kicad/mainboard/coiltester.pretty/`) | Drawn 2026-11-18, slots 2026-11-18. User-measured: body 28.2 × 8.0 mm, flat pins 3.0 × 0.5 mm with the 3 mm side across the 8 mm width, pitch 22.5 mm (also in the ESKA catalogue), pins on the centreline, M3 × 4.5 screw at the centre. Pads 1 and 2 at ±11.25 mm, **oval slot 3.4 × 0.9 mm (long side across the width), pad 2.1 × 4.6 mm**, 3.2 mm non-plated hole at the centre, courtyard 29.2 × 9 mm. Keep copper out of the screw-head area (about 6 mm dia). Slot drilling is a routing step at the board house: check that JLCPCB accepts a 0.9 mm slot width (or use a 1.0 mm slot). |
| F2 ×2 | SMD1812P200TF/16 | `Fuse:Fuse_1812_4532Metric` | |

## Passives and connectors

| Ref | Part | Footprint | Notes |
|---|---|---|---|
| R (SMD) | 0805 resistors | `Resistor_SMD:R_0805_2012Metric` | |
| C (SMD) | 0805 capacitors | `Capacitor_SMD:C_0805_2012Metric` | The 10 µF parts are also **0805** (KEMET 10 µF X7R 10 %, 16 V; ordered, confirmed 2026-11-18): use `C_0805_2012Metric`. All rails they sit on are 9 V or lower, so 16 V is enough (X7R loses capacity under DC bias, which is fine for decoupling). |
| R_T1, R_T2 (R408, R409) | Vishay MBB0207, 100 kΩ | `Resistor_THT:R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal` | ✔ Checked 2026-11-18 (user-measured): body 6.5 × 2.5 mm, lead 0.6 mm, lead spacing 10 mm. The footprint is 6.3 × 2.5 mm, pitch 10.16 mm, drill 0.8 mm: the 0.6 mm lead fits, the pitch is 0.16 mm wider (bend the leads) and the body is 0.2 mm longer than drawn (inside the courtyard margin). Rated 350 V. Leave extra clearance (2 mm) to other copper. |
| R_L1 (R402) | VIT ZC207 / ZCM207 1k MELF | `Resistor_SMD:R_MELF_MMB-0207` | ✔ Checked against the ZCM series datasheet (2026-11-18): body L 5.8 (+0/−0.3) × Ø 2.2 ±0.2 mm, end cap 1.25 mm, 1 W (power operation) / 0.4 W (standard) at 70 °C, 350 V max working. The KiCad footprint has pads 2.1 × 2.6 mm at ±2.45 mm (gap 2.8, span 7.0 mm): the same span and pad width as the datasheet's wave-soldering pads (gap 2.4, pad 2.3 × 2.6, span 7.0), and 0.4 mm more gap, which still sits under the end caps. Fine. The 1 W figure needs the board to keep the film cool; the pickup load is only pulsed. |
| R_L2 | METALL 10k | `Resistor_THT:R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal` | |
| C1 (C101) | WL1E477M10016100, 470 µF 25 V | `Capacitor_THT:CP_Radial_D10.0mm_P5.00mm` | ✔ Checked 2026-11-18 (user-measured): Ø 10 mm, length 16 mm, lead spacing 5 mm. The footprint is described as diameter 10 mm, height 16 mm, pitch 5.00 mm, with a 1.0 mm drill and 2.0 mm pad: an exact match. Lead diameter not measured (usually 0.6 mm; fits the 1.0 mm drill). Stripe = −. 16 mm tall: check clearance to the enclosure and to J1. |
| J1, J3, J4, J6, J7 | SPTH 3/2-5,08 (Phoenix 1580780) | `TerminalBlock_Phoenix:TerminalBlock_Phoenix_MKDS-1,5-2-5.08_1x02_P5.08mm_Horizontal` | ✔ Checked against the Phoenix datasheet (2026-11-18): pitch 5.08 mm, one solder pin per pole, **drill 1.3 mm** (the footprint: 1.3 drill, 2.6 pad), pin length 3.5 mm, wire entry parallel to the board (0°). The pads match. The body differs a little: 11.12 (l) × 10 (w) mm against the footprint's 10.2 × 9.8, so keep about 1.5 mm free around the courtyard; height 21.5 mm. It is a **push-in spring terminal** (4 mm², 32 A, 400 V), not a screw terminal: flexible wire without a ferrule needs the orange actuator pressed. Strip 8 mm. Face the wire opening toward the board edge. |
| J5 | SPTH 1.5 3 5.08 | `…MKDS-1,5-3-5.08_1x03_P5.08mm_Horizontal` | ✔ Pitch 5.08 mm confirmed (user-measured 2026-11-18). The user's "length 9.85 mm" is taken as the body depth: the footprint is 15.2 mm long (9.8 deep), so the depth matches; the length along the poles is not given, so keep about 1.5 mm free at both ends. Height 17.25 mm. ⚠ Pin diameter / drill not given: the footprint's 1.3 mm drill (2.6 mm pad) fits any pin up to about 1.1 mm; measure the pin once to be sure. Wire opening toward the board edge. |
| J21, J22 | SPTH 1.5 4 5.08 | `…MKDS-1,5-4-5.08_1x04_P5.08mm_Horizontal` | ✔ Pitch 5.08 mm confirmed (user-measured 2026-11-18). The user's "length 9.85 mm" is taken as the body depth: the footprint is 20.3 mm long (9.8 deep), so the depth matches; the length along the poles is not given, so keep about 1.5 mm free at both ends. Height 17.25 mm. ⚠ Pin diameter / drill not given: the footprint's 1.3 mm drill (2.6 mm pad) fits any pin up to about 1.1 mm; measure the pin once to be sure. Wire opening toward the board edge. |
| J8 | 2 × 8 header | `Connector_PinHeader_2.54mm:PinHeader_2x08_P2.54mm_Vertical` | |
| JP1 | 1 × 3 header | `Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical` | |
| JC1, JC2 | 1 × 3 female | `Connector_PinSocket_2.54mm:PinSocket_1x03_P2.54mm_Vertical` | |
| SW_RST | 6 × 6 mm button | `Button_Switch_THT:SW_PUSH_6mm` | |
| TP1…TP22 | pin or wire | `Connector_PinHeader_2.54mm:PinHeader_1x01_P2.54mm_Vertical` | 1.0 mm hole fits a header pin or a bent wire up to about 0.8 mm. |
| mounting | M3 holes | `MountingHole:MountingHole_3.2mm_M3_Pad` (or no pad) | 4 corners. |
| LEDs | 3 mm | `LED_THT:LED_D3.0mm` | Cathode (flat side) marked. |

## To measure when the parts arrive (before layout is final)

1. ESKA fuse clips: fit check of the 3.4 × 0.9 mm slots on the real part.
2. SPTH 1.5 terminal blocks (J5, J21, J22): pin diameter only (pitch and depth confirmed). The 2-pole SPTH 3 is done.
3. Omron G5LE-1: fit check on the real relay (the stock footprint already matches the datasheet).
4. ~~The 10 µF capacitor package~~ closed 2026-11-18: ordered as 0805.
5. Pico socket pins: fit in the Pico footprint holes.
