#!/usr/bin/env node
// Generates hardware/kicad/mainboard/mainboard-ch-tg.kicad_sch: CH-TG (CDI trigger simulator, isolated measurement bus,
// supplies on the 12 V side), hardware/circuits/ch-tg-trigger.md, as a netlist-style sheet (real KiCad symbols, every pin labelled).
// Usage: KICAD_SYMBOLS=<kicad-symbols checkout> node tools/kicad/gen-ch-tg-sheet.mjs [--nets]
import { Sheet } from './sch-lib.mjs';

const s = new Sheet('CH-TG');
const R = 'Device:R', C = 'Device:C';
const R0805 = 'Resistor_SMD:R_0805_2012Metric', C0805 = 'Capacitor_SMD:C_0805_2012Metric', C1206 = 'Capacitor_SMD:C_1206_3216Metric';
const GL = 'GND_L', GP = 'GND_P', V3P = '3V3_P', ARM = '12V_ARMED', RAW = '12V_RAW', M5 = '-5V_P', P5 = '+5V_P', P9 = '+9V_P';
const SOT89 = 'Package_TO_SOT_SMD:SOT-89-3';

s.note(10, 8, 'CH-TG: CDI trigger simulator, isolated measurement bus and the 12 V-side supplies (generated)', 2.54);
s.note(10, 16, 'Source: hardware/circuits/ch-tg-trigger.md. Everything on this sheet except the optocoupler / photoMOS LED sides and the ADuM1250 logic side is in the 12 V power domain (GND_P). Each pin carries its net as a global label.');
s.note(10, 21, 'References in the 500 series. R503..R511 measurement dividers, R512/R513 amplifier A (gain 3), R514/R515 amplifier B (gain -1), U506 = U14 ADuM1250, U507/U508 = U16/U17 MCP4725, U509 = U18 TL072, U510 = U19 4052, U501 = U10, U502 = U11, U503 = U12, U504 = U13, U505 = U20.');
s.note(10, 26, 'WARNING: this board carries no HV, but the CDI makes 200-400 V and the coil makes kV. Fire the CDI only into a coil and spark gap in a closed non-conductive box. See docs/safety.md.');

// ---------------------------------------------------------------- 1 supplies
s.box(8, 31, 282, 120);
s.note(10, 32, '1 Supplies: 3V3_P always on from 12V_RAW; +5V_P, -5V_P and +9V_P only while armed (12V_ARMED)');
s.place({ libId: 'Regulator_Linear:L78L05_SOT89', ref: 'U501', value: 'TS78L05ACY (U10)', footprint: SOT89, x: 30, y: 52, nets: { 3: RAW, 2: GP, 1: '5V_RAW' } });
s.two(C, 'C501', '100n', C0805, 80, 52, RAW, GP);
s.place({ libId: 'Regulator_Linear:MCP1700x-330xxTT', ref: 'U502', value: 'MCP1702T-3302E/CB (U11)', footprint: 'Package_TO_SOT_SMD:SOT-23', x: 140, y: 52, nets: { 3: '5V_RAW', 1: GP, 2: V3P } });
s.two(C, 'C502', '1u', C0805, 190, 52, '5V_RAW', GP);
s.two(C, 'C503', '10u (3V3_P)', C1206, 245, 52, V3P, GP);
s.two(C, 'C504', '100n (3V3_P)', C0805, 245, 70, V3P, GP);
s.place({ libId: 'Regulator_Linear:L78L05_SOT89', ref: 'U503', value: 'TS78L05ACY (U12)', footprint: SOT89, x: 30, y: 95, nets: { 3: ARM, 2: GP, 1: P5 } });
s.two(C, 'C505', '100n', C0805, 80, 95, ARM, GP);
s.two(C, 'C506', '10u (+5V_P)', C1206, 80, 113, P5, GP);
s.place({ libId: 'Regulator_SwitchedCapacitor:ICL7660', ref: 'U504', value: 'ICL7660SCPA (U13)', footprint: 'Package_DIP:DIP-8_W7.62mm', x: 150, y: 100, nets: { 8: P5, 3: GP, 5: M5, 2: 'CAP_P', 4: 'CAP_N' }, nc: [1, 6, 7] });
s.two(C, 'C507', '10u (pump)', C1206, 205, 95, 'CAP_P', 'CAP_N');
s.two(C, 'C508', '10u (-5V_P)', C1206, 205, 113, GP, M5);
s.place({ libId: 'Regulator_Linear:L78L09_TO92', ref: 'U505', value: 'uA78L09 (U20)', footprint: 'Package_TO_SOT_THT:TO-92_Inline', x: 30, y: 133, nets: { 3: ARM, 2: GP, 1: P9 } });
s.two(C, 'C509', '100n', C0805, 80, 133, ARM, GP);
s.two(C, 'C510', '10u (+9V_P)', C1206, 130, 133, P9, GP);

// ---------------------------------------------------------------- 2 isolated bus
s.box(294, 31, 292, 120);
s.note(296, 32, '2 Isolated I2C (ADuM1250) and level-shifting dividers for the power-side ADS1115 (JM2 is on the I/O sheet)');
s.place({ libId: 'Isolator:ADuM1250', ref: 'U506', value: 'ADuM1250ARZ (U14)', footprint: 'Package_SO:SOIC-8_3.9x4.9mm_P1.27mm', x: 335, y: 62, nets: { 1: '3V3', 2: 'SDA', 3: 'SCL', 4: GL, 8: V3P, 7: 'SDA_P', 6: 'SCL_P', 5: GP } });
s.two(C, 'C511', '100n (logic side)', C0805, 420, 50, '3V3', GL);
s.two(C, 'C512', '100n (power side)', C0805, 420, 66, V3P, GP);
s.two(R, 'R501', '4.7k (SDA_P pull-up)', R0805, 490, 50, V3P, 'SDA_P');
s.two(R, 'R502', '4.7k (SCL_P pull-up)', R0805, 490, 66, V3P, 'SCL_P');
const dv = [
  ['R503', '100k', ['OUT', 'V_OUT_M']], ['R504', '33k', ['V_OUT_M', GP]], ['R505', '56k', ['V_OUT_M', V3P]],
  ['R506', '68k', ['V_AMP+', 'V_AMPP_M']], ['R507', '30k', ['V_AMPP_M', GP]], ['R508', '150k', ['V_AMP-', 'V_AMPN_M']],
  ['R509', '100k', ['V_AMPN_M', V3P]], ['R510', '100k', [ARM, 'V_ARM_M']], ['R511', '27k', ['V_ARM_M', GP]],
];
dv.forEach(([ref, val, [a, b]], i) => s.two(R, ref, val, R0805, 312 + (i % 6) * 46, 105 + Math.floor(i / 6) * 20, a, b));
s.note(296, 142, 'V_OUT_M = OUT*0.17+1.0 V; V_AMPP_M = V_AMP+/3.3; V_AMPN_M = V_AMP-*0.4+2.0 V; V_ARM_M = 12V_ARMED*0.21 (ADS1115 inputs stay between 0 and 3.3 V)');

// ---------------------------------------------------------------- 3 amplitude
s.box(8, 155, 282, 108);
s.note(10, 156, '3 Amplitude: MCP4725 DAC + TL072 per polarity. V_AMP+ = 3 x DAC (0..8 V), V_AMP- = -1 x DAC (0..-3.3 V)');
s.place({ libId: 'Analog_DAC:MCP4725xxx-xCH', ref: 'U507', value: 'MCP4725A0T-E/CH (0x60)', footprint: 'Package_TO_SOT_SMD:SOT-23-6', x: 35, y: 190, nets: { 1: 'DAC_P', 2: GP, 3: V3P, 4: 'SDA_P', 5: 'SCL_P', 6: GP } });
s.place({ libId: 'Analog_DAC:MCP4725xxx-xCH', ref: 'U508', value: 'MCP4725A0T-E/CH (0x61)', footprint: 'Package_TO_SOT_SMD:SOT-23-6', x: 35, y: 235, nets: { 1: 'DAC_N', 2: GP, 3: V3P, 4: 'SDA_P', 5: 'SCL_P', 6: V3P } });
s.two(C, 'C513', '100n (U507)', C0805, 95, 175, V3P, GP);
s.two(C, 'C514', '100n (U508)', C0805, 95, 250, V3P, GP);
const ta = (unit, x, y, nets) => s.place({ libId: 'Amplifier_Operational:TL072', ref: 'U509', value: 'TL072CD (U18)', footprint: 'Package_SO:SOIC-8_3.9x4.9mm_P1.27mm', unit, x, y, nets });
ta(1, 150, 190, { 3: 'DAC_P', 2: 'TG_FBP', 1: 'V_AMP+' });
s.two(R, 'R512', '10k (R_G)', R0805, 205, 178, 'TG_FBP', GP);
s.two(R, 'R513', '20k (R_F)', R0805, 205, 198, 'TG_FBP', 'V_AMP+');
ta(2, 150, 235, { 5: GP, 6: 'TG_FBN', 7: 'V_AMP-' });
s.two(R, 'R514', '10k (R_IN)', R0805, 205, 225, 'DAC_N', 'TG_FBN');
s.two(R, 'R515', '10k (R_F)', R0805, 205, 245, 'TG_FBN', 'V_AMP-');
ta(3, 255, 205, { 8: ARM, 4: M5 });
s.two(C, 'C515', '100n (V+)', C0805, 255, 235, ARM, GP);
s.two(C, 'C516', '100n (V-)', C0805, 255, 250, GP, M5);

// ---------------------------------------------------------------- 4 mux
s.box(294, 155, 292, 108);
s.note(296, 156, '4 Pulse mux 4052 (X section): select B A = 11 and 00 -> GND (idle), 10 -> V_AMP+ (pulse A on), 01 -> V_AMP- (pulse B on). INH pulled high = disabled.');
s.place({ libId: '4xxx:4052', ref: 'U510', value: 'SMD 4052 (HEF4052BT, 3-15 V) (U19)', footprint: 'Package_SO:SOIC-16_3.9x9.9mm_P1.27mm', x: 345, y: 210, nets: { 12: GP, 14: 'V_AMP-', 15: 'V_AMP+', 11: GP, 10: 'MUX_A', 9: 'MUX_B', 6: 'MUX_INH', 13: 'TG_S', 16: 'MUX_VDD', 7: M5, 8: GP, 1: GP, 5: GP, 2: GP, 4: GP, 3: GP } });
s.place({ libId: 'Connector:Conn_01x03_Pin', ref: 'JP1', value: 'mux supply: jumper 2-3 = +9V_P (default), 1-2 = +5V_P', footprint: 'Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical', x: 450, y: 195, nets: { 1: P5, 2: 'MUX_VDD', 3: P9 } });
s.two(C, 'C517', '100n (MUX_VDD)', C0805, 510, 185, 'MUX_VDD', GP);
s.two(C, 'C518', '10u (MUX_VDD)', C1206, 510, 203, 'MUX_VDD', GP);
s.two(C, 'C519', '100n (VEE)', C0805, 510, 221, GP, M5);

// ---------------------------------------------------------------- 5 optocouplers for the mux
s.box(8, 267, 282, 120);
s.note(10, 268, '5 Optocouplers: GP6 / GP7 / TG_EN switch the mux lines. Pull-ups go to MUX_VDD, never above the mux supply.');
[['U511', 'MUX_A', 'TG_PULSE_A', 'R516', 'R517', 285, 'A (positive pulse)'], ['U512', 'MUX_B', 'TG_PULSE_B', 'R518', 'R519', 325, 'B (negative pulse)'], ['U513', 'MUX_INH', 'TG_EN', 'R520', 'R521', 365, 'ENABLE']].forEach(([u, net, ctrl, rl, rp, y, name]) => {
  s.place({ libId: 'Isolator:PC817', ref: u, value: `PC817 ${name}`, footprint: 'Package_DIP:DIP-4_W7.62mm', x: 50, y, nets: { 1: `${u}_A`, 2: GL, 3: GP, 4: net } });
  s.two(R, rl, '330 (LED)', R0805, 150, y - 4, ctrl, `${u}_A`);
  s.two(R, rp, '4.7k (pull-up)', R0805, 235, y - 4, 'MUX_VDD', net);
});

// ---------------------------------------------------------------- 6 output, source impedance, kill outputs
s.box(294, 267, 292, 132);
s.note(296, 268, '6 Output: source impedance bank (select one), TVS, CDI connector J5 and the SHUT DOWN kill outputs');
const pr = (ref, y, ctrl, far, rv, rr, rled, farNet, farNote) => {
  s.place({ libId: 'Relay_SolidState:AQY282EH', ref, value: 'AQY212EH', footprint: 'Package_DIP:DIP-4_W7.62mm', x: 335, y, nets: { 1: `${ref}_A`, 2: GL, 3: far, 4: `${ref}_B` } });
  s.two(R, rled, '330 (LED)', R0805, 385, y - 6, ctrl, `${ref}_A`);
  s.two(R, rr, rv, R0805, 445, y, `${ref}_B`, farNet);
};
pr('PR5', 290, 'TG_IMP0', 'TG_S', '100', 'R522', 'R523', 'OUT');
pr('PR6', 315, 'TG_IMP1', 'TG_S', '470', 'R524', 'R525', 'OUT');
pr('PR7', 340, 'TG_IMP2', 'TG_S', '2.2k', 'R526', 'R527', 'OUT');
pr('PR8', 365, 'KILL_GND', 'SHUT', '100 (SHUT to GND_P)', 'R528', 'R529', GP);
pr('PR9', 390, 'KILL_HI', 'SHUT', '1k (SHUT to 12V_ARMED)', 'R530', 'R531', ARM);
s.place({ libId: 'Connector:Screw_Terminal_01x03', ref: 'J5', value: 'CDI: 1 TRIG+, 2 SHUT DOWN, 3 GND (green)', footprint: 'TerminalBlock_Phoenix:TerminalBlock_Phoenix_MKDS-1,5-3-5.08_1x03_P5.08mm_Horizontal', x: 540, y: 290, nets: { 1: 'OUT', 2: 'SHUT', 3: GP } });
s.place({ libId: 'Device:D_TVS', ref: 'D501', value: 'P4SMAJ15CA (D8, bidirectional)', footprint: 'Diode_SMD:D_SMA', x: 540, y: 330, nets: { 1: 'OUT', 2: GP } });

s.note(10, 392, 'Pin order checks: 78L05 SOT-89 1 OUT 2 GND 3 IN; 78L09 TO-92 1 OUT 2 GND 3 IN; MCP1702 SOT-23A 1 GND 2 VOUT 3 VIN (all from the user\'s datasheet pictures).');
s.note(10, 398, 'Stand-in symbols with the same pinout: AQY282EH for the AQY212EH photoMOS, MCP1700x-330xxTT for the MCP1702, MCP4725xxx-xCH, TL072, 4xxx:4052 (HEF4052BT / CD4052B).');
s.note(10, 404, 'CDI POWER+ comes from J3 on the ARM sheet (12V_ARMED through the 2 A fuse). The CDI IGNITION wire goes straight to the ignition coil, not to this board.');

const out = 'hardware/kicad/mainboard/mainboard-ch-tg.kicad_sch';
const size = s.write(out, 'A2');
console.log(`wrote ${out} (${size} bytes)`);
if (process.argv.includes('--nets')) for (const [n, p] of [...s.netlist].sort()) console.log(n.padEnd(14), p.join('  '));
for (const w of s.warn) console.warn('WARN', w);
