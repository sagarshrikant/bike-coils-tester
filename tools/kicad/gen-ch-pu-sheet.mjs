#!/usr/bin/env node
// Generates hardware/kicad/mainboard/mainboard-ch-pu.kicad_sch: CH-PU (pickup dynamic input), hardware/circuits/ch-pu-pickup.md,
// as a netlist-style sheet (real KiCad symbols, every pin labelled).
// Usage: KICAD_SYMBOLS=<kicad-symbols checkout> node tools/kicad/gen-ch-pu-sheet.mjs [--nets]
import { Sheet } from './sch-lib.mjs';

const s = new Sheet('CH-PU');
const R = 'Device:R', C = 'Device:C', D = 'Device:D';
const R0805 = 'Resistor_SMD:R_0805_2012Metric', C0805 = 'Capacitor_SMD:C_0805_2012Metric';
const AXIAL = 'Resistor_THT:R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal';
const GL = 'GND_L', AG = 'AGND', V3 = '3V3A';

s.note(10, 8, 'CH-PU: pickup dynamic input (generated)', 2.54);
s.note(10, 16, 'Source: hardware/circuits/ch-pu-pickup.md. Fixed HV-rated top divider, switched low-voltage bottom legs, 1.65 V bias, buffered into the Pico ADC, comparators for edge timing. Default after reset = +-100 V range.');
s.note(10, 21, 'References in the 400 series. R402 R_L1, R405 R_L2, R407 R_INJ, R408/R409 R_T1/R_T2, R410..R412 R_B5/R_B20/R_B100, R413 R_S, R416 R_OUT, U401 op-amp (A = bias, B = signal), U402 74HC4066, U403 comparator, U404 DAC, D401 = D1 (TVS).');
s.note(10, 26, 'WARNING: pickup coils only. Never connect J7 to a CDI output or an ignition coil. See docs/safety.md.');

// ---- 1. input, protection, loads, self-test
s.box(8, 31, 205, 96);
s.note(10, 32, '1 Input, protection, loads (P6), self-test injection');
s.place({ libId: 'Connector:Screw_Terminal_01x02', ref: 'J7', value: 'pickup: IN+ (red), IN- (black)', footprint: 'TerminalBlock_Phoenix:TerminalBlock_Phoenix_MKDS-1,5-2-5.08_1x02_P5.08mm_Horizontal', x: 30, y: 48, nets: { 1: 'PU_IN', 2: AG } });
s.place({ libId: 'Device:D_TVS', ref: 'D401', value: 'P4SMAJ120CA (bidirectional)', footprint: 'Diode_SMD:D_SMA', x: 100, y: 48, nets: { 1: 'PU_IN', 2: AG } });
s.two(R, 'R407', '220k (R_INJ self-test)', R0805, 170, 48, 'PU_TEST', 'PU_IN');
const pr = (n, y, ctrl, rl, rv, rlRef, fp, rled) => {
  s.place({ libId: 'Relay_SolidState:AQY282EH', ref: `PR${n}`, value: 'AQY210EH (350 V)', footprint: 'Package_DIP:DIP-4_W7.62mm', x: 38, y, nets: { 1: `PR${n}_A`, 2: GL, 3: 'PU_IN', 4: `PR${n}_B` } });
  s.two(R, `R${rled}`, '330 (LED)', R0805, 85, y + 8, ctrl, `PR${n}_A`);
  s.two(R, rlRef, rv, fp, 150, y - 2, `PR${n}_B`, AG);
};
pr(1, 70, 'PU_LOAD1', 'R_L1', '1k 1W MELF (R_L1)', 'R402', 'Resistor_SMD:R_MELF_MMB-0207', 403);
pr(2, 102, 'PU_LOAD2', 'R_L2', '10k 0.5W (R_L2)', 'R405', AXIAL, 406);

// ---- 2. divider and range legs, 74HC4066
s.box(217, 31, 215, 96);
s.note(219, 32, '2 Divider (R_T1 + R_T2 = 200 k) and range legs, switched by the 74HC4066');
s.two(R, 'R408', '100k 0.6W (R_T1)', AXIAL, 248, 48, 'PU_IN', 'PU_MID');
s.two(R, 'R409', '100k 0.6W (R_T2)', AXIAL, 305, 48, 'PU_MID', 'PU_N');
s.two(R, 'R410', '84.5k (R_B5)', R0805, 248, 70, 'PU_N', 'PU_L5');
s.two(R, 'R411', '16.5k (R_B20)', R0805, 248, 86, 'PU_N', 'PU_L20');
s.two(R, 'R412', '3k (R_B100)', R0805, 248, 102, 'PU_N', 'PU_L100');
const sw = (unit, y, yy, zz, ee) => s.place({ libId: 'Analog_Switch:HEF4066BT', ref: 'U402', value: '74HC4066 (SO-14)', footprint: 'Package_SO:SOIC-14_3.9x8.7mm_P1.27mm', unit, x: 372, y, nets: { [yy[0]]: yy[1], [zz[0]]: zz[1], [ee[0]]: ee[1] } });
sw(1, 50, [1, 'PU_L5'], [2, 'V_BIAS'], [13, 'PU_RANGE5']);
sw(2, 68, [4, 'PU_L20'], [3, 'V_BIAS'], [5, 'PU_RANGE20']);
sw(3, 86, [8, 'PU_L100'], [9, 'V_BIAS'], [6, 'PU_RANGE100']);
s.place({ libId: 'Analog_Switch:HEF4066BT', ref: 'U402', value: '74HC4066 (SO-14), unused switch tied to ground', footprint: 'Package_SO:SOIC-14_3.9x8.7mm_P1.27mm', unit: 4, x: 372, y: 104, nets: { 11: AG, 10: AG, 12: AG } });
s.place({ libId: 'Analog_Switch:HEF4066BT', ref: 'U402', value: '74HC4066 (SO-14)', footprint: 'Package_SO:SOIC-14_3.9x8.7mm_P1.27mm', unit: 5, x: 415, y: 68, nets: { 14: V3, 7: AG } });

// ---- 3. clamp, buffers, bias
s.box(8, 131, 205, 100);
s.note(10, 132, '3 Node sense: R_S, plug-in clamp (BAT54S on JC2), buffer U401B, V_BIAS generator');
s.two(R, 'R413', '1k (R_S)', R0805, 35, 150, 'PU_N', 'PU_CL');
s.place({ libId: 'Connector:Conn_01x03_Socket', ref: 'JC2', value: 'clamp module: 1 3V3A, 2 NODE, 3 AGND', footprint: 'Connector_PinSocket_2.54mm:PinSocket_1x03_P2.54mm_Vertical', x: 95, y: 150, nets: { 1: V3, 2: 'PU_CL', 3: AG } });
const op = (unit, x, y, nets) => s.place({ libId: 'Amplifier_Operational:MCP6002-xMS', ref: 'U401', value: 'MCP6472-E/MS', footprint: 'Package_SO:MSOP-8_3x3mm_P0.65mm', unit, x, y, nets });
op(2, 160, 150, { 5: 'PU_CL', 6: 'PU_BUF', 7: 'PU_BUF' });
op(1, 160, 185, { 3: 'VB_RAW', 2: 'V_BIAS', 1: 'V_BIAS' });
op(3, 195, 205, { 8: V3, 4: AG });
s.two(R, 'R414', '10k (V_BIAS divider)', R0805, 35, 175, V3, 'VB_RAW');
s.two(R, 'R415', '10k (V_BIAS divider)', R0805, 35, 190, 'VB_RAW', AG);
s.two(C, 'C402', '1u', C0805, 35, 205, 'VB_RAW', AG);
s.two(R, 'R416', '100 (R_OUT)', R0805, 35, 220, 'PU_BUF', 'PU_SIG');

// ---- 4. threshold DAC and comparators
s.box(217, 131, 215, 100);
s.note(219, 132, '4 Edge detection: threshold DAC U404 and comparators U403 (outputs to GP2 / GP3)');
s.place({ libId: 'Analog_DAC:MCP4822', ref: 'U404', value: 'MCP4822-E/P', footprint: 'Package_DIP:DIP-8_W7.62mm', x: 262, y: 175, nets: { 1: V3, 2: 'PU_DAC_CS', 3: 'SPI0_SCK', 4: 'SPI0_MOSI', 5: AG, 6: 'VTHN', 7: AG, 8: 'VTHP' } });
const cmp = (unit, x, y, nets) => s.place({ libId: 'Comparator:MCP6562', ref: 'U403', value: 'MCP6542-I/SN (push-pull)', footprint: 'Package_SO:SOIC-8_3.9x4.9mm_P1.27mm', unit, x, y, nets });
cmp(1, 350, 155, { 3: 'PU_BUF', 2: 'VTHP', 1: 'PU_POS' });
cmp(2, 350, 190, { 5: 'VTHN', 6: 'PU_BUF', 7: 'PU_NEG' });
cmp(3, 405, 210, { 8: V3, 4: AG });

// ---- 5. decoupling
s.box(8, 235, 424, 18);
s.note(10, 236, '5 Decoupling, 100 nF at each IC supply pin (close to the pins)');
[['C403', 'U401'], ['C404', 'U402'], ['C405', 'U403'], ['C406', 'U404']].forEach(([ref, u], i) => s.two(C, ref, `100n (${u})`, C0805, 50 + i * 60, 246, V3, AG));

// ---- 6. optional peak hold (DNP)
s.box(8, 257, 424, 38);
s.note(10, 258, '6 Optional peak hold (DNP): fit only if the sampled waveform misses narrow peaks. Reset: drive the 1 k line (low for PK+, high for PK-) for 1 ms, then release.');
s.place({ libId: D, ref: 'D402', value: 'BAT54HT1G (D4, positive peak)', footprint: 'Diode_SMD:D_SOD-323', x: 40, y: 278, nets: { 2: 'PU_BUF', 1: 'PU_PKP' }, dnp: true });
s.two(C, 'C407', '10n', C0805, 85, 278, 'PU_PKP', AG);
s.two(R, 'R417', '10M', R0805, 125, 278, 'PU_PKP', AG);
s.two(R, 'R418', '1k (reset)', R0805, 170, 278, 'PU_PKP', 'PU_PKRST_P');
s.place({ libId: D, ref: 'D403', value: 'BAT54HT1G (D5, negative peak)', footprint: 'Diode_SMD:D_SOD-323', x: 235, y: 278, nets: { 2: 'PU_PKN', 1: 'PU_BUF' }, dnp: true });
s.two(C, 'C408', '10n', C0805, 280, 278, 'PU_PKN', AG);
s.two(R, 'R419', '10M', R0805, 320, 278, 'PU_PKN', V3);
s.two(R, 'R420', '1k (reset)', R0805, 365, 278, 'PU_PKN', 'PU_PKRST_N');

const out = 'hardware/kicad/mainboard/mainboard-ch-pu.kicad_sch';
const size = s.write(out, 'A3');
console.log(`wrote ${out} (${size} bytes)`);
if (process.argv.includes('--nets')) for (const [n, p] of [...s.netlist].sort()) console.log(n.padEnd(14), p.join('  '));
for (const w of s.warn) console.warn('WARN', w);
