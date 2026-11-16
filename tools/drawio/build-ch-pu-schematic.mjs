#!/usr/bin/env node
// Builds hardware/diagrams/ch-pu-schematic.drawio.svg (CH-PU, pickup dynamic input).
// Usage: node tools/drawio/build-ch-pu-schematic.mjs [--force]
// Once the file exists the .drawio.svg is the source of truth: do not overwrite it without --force.
import { createSchematic, C } from './schematic-lib.mjs';

const W = 1560, H = 1110;
const s = createSchematic({ W, H, title: 'CH-PU schematic' });
const { wire, dot, text, box, resistorH, resistorV, capacitor, diodeUp, diodeDown, tvs, ground, rail, terminal, switchV, opamp, icBox } = s;

text(20, 28, 'CH-PU: pickup dynamic input · schematic (PROPOSED, Phase 2)', { size: 18, bold: true });
text(20, 48, 'Fixed HV-rated top divider, switched low-voltage bottom leg, 1.65 V bias, buffered into the Pico ADC. Pickup comparators give edge timing. Default after reset = ±100 V range.', { size: 11, color: C.dim });

// ---------------------------------------------------------------- A: input, protection, loads, self-test
box(20, 80, 300, 350, { fill: '#fefce8', stroke: '#ca8a04', dashed: true, label: '1 · Input, protection, loads, self-test', size: 12 });
terminal(50, 200, C.drv); text(30, 184, 'IN+  (red clip)', { size: 11, bold: true, color: C.drv });
terminal(50, 330, C.gnd); text(30, 314, 'IN−  (black clip)', { size: 11, bold: true });
wire([[56, 200], [340, 200]], C.drv);
wire([[56, 330], [90, 330]], C.gnd); dot(90, 330, C.gnd); ground(90, 336);
dot(110, 200, C.drv); tvs(110, 200); ground(110, 262);
text(28, 292, 'D1: bidirectional TVS ≈ 120 V', { size: 9, color: C.clamp, bold: true });
// loads (P6): photoMOS (350 V class) + resistor
for (const [x, tag, val] of [[180, 'PR1', 'R_L1 1 kΩ 1 W'], [255, 'PR2', 'R_L2 10 kΩ']]) {
  dot(x, 200, C.drv); wire([[x, 200], [x, 215]], C.drv);
  switchV(x, 215);
  wire([[x, 255], [x, 262]]);
  resistorV(x, 262); ground(x, 344);
  text(x + 16, 234, `${tag}\nphotoMOS`, { size: 9, color: C.dig, bold: true });
  text(x + 16, 304, val.replace(' ', '\n'), { size: 9, color: C.dim });
}
// self-test injection
resistorV(300, 108, C.dig); wire([[300, 188], [300, 200]], C.dig); dot(300, 200, C.dig);
text(292, 124, 'PU_TEST', { size: 10, anchor: 'end', bold: true, color: C.dig });
text(292, 137, '(EXP1.A5)', { size: 9, anchor: 'end', color: C.dig });
text(290, 162, 'R_INJ 220 kΩ', { size: 9, anchor: 'end', color: C.dim });

// ---------------------------------------------------------------- B: divider and ranges
box(330, 80, 460, 350, { fill: '#eff6ff', stroke: '#2563eb', dashed: true, label: '2 · Divider and range legs', size: 12 });
resistorH(340, 200, C.drv); text(380, 176, 'R_T1\n100 kΩ', { size: 9, anchor: 'middle', bold: true });
wire([[420, 200], [430, 200]], C.drv);
resistorH(430, 200, C.drv); text(470, 176, 'R_T2\n100 kΩ', { size: 9, anchor: 'middle', bold: true });
wire([[510, 200], [540, 200]], C.drv); dot(540, 200, C.drv);
text(545, 222, 'N', { size: 11, bold: true });
wire([[540, 200], [800, 200]], C.sense);
const legs = [[600, 'R_B5\n84.5 k', '±5 V', 'S1'], [670, 'R_B20\n16.5 k', '±20 V', 'S2'], [740, 'R_B100\n3 k', '±100 V', 'S3']];
for (const [x, lab, rng, sw] of legs) {
  dot(x, 200, C.sense); wire([[x, 200], [x, 215]], C.sense);
  resistorV(x, 215, C.sense);
  text(x + 14, 248, lab, { size: 9, color: C.dim });
  text(x, 188, rng, { size: 10, anchor: 'middle', bold: true, color: C.sense });
  switchV(x, 295, sw, C.sense);
  wire([[x, 335], [x, 415]], C.bias); dot(x, 415, C.bias);
}
text(340, 404, 'V_BIAS 1.65 V (bottom legs return here)', { size: 10, bold: true, color: C.bias });
text(345, 305, 'S1–S3 = 74HC4066\n(3 of 4 switches, 3V3A)\ncontrols from MCP23017\nreset default: S3 ON', { size: 9, color: C.dig });
wire([[310, 415], [740, 415]], C.bias);

// ---------------------------------------------------------------- C: clamp, buffer, ADC
box(800, 80, 700, 350, { fill: '#f0fdf4', stroke: '#16a34a', dashed: true, label: '3 · Clamp, buffer, ADC drive', size: 12 });
resistorH(810, 200, C.sense); text(850, 180, 'R_S 1 kΩ', { size: 10, anchor: 'middle', bold: true });
wire([[890, 200], [910, 200]], C.sense); dot(910, 200, C.sense);
rail(910, 118, '3V3A'); wire([[910, 118], [910, 125]], C.clamp);
diodeUp(910, 125); wire([[910, 155], [910, 200]], C.clamp);
wire([[910, 200], [910, 215]], C.clamp); diodeUp(910, 215); wire([[910, 245], [910, 255]], C.clamp); ground(910, 255);
text(896, 150, 'D2 / D3 = BAT54S\non plug-in header', { size: 9, anchor: 'end', color: C.clamp, bold: true });
const u1b = opamp(990, 170, 'U1B  MCP6002 (buffer)');
wire([[910, 200], [960, 200], [960, u1b.inP[1]], [u1b.inP[0], u1b.inP[1]]], C.sense);
wire([[u1b.inN[0], u1b.inN[1]], [975, u1b.inN[1]], [975, 250], [1070, 250], [1070, 200]], C.sense);
wire([[u1b.out[0], u1b.out[1]], [1070, 200]], C.sense); dot(1070, 200, C.sense); dot(1070, 250, C.sense);
text(1080, 192, 'OUT', { size: 11, bold: true, color: C.sense });
wire([[1070, 200], [1100, 200]], C.sense);
resistorH(1100, 200, C.sense); text(1140, 180, 'R_OUT 100 Ω', { size: 10, anchor: 'middle' });
wire([[1180, 200], [1210, 200]], C.sense);
text(1216, 196, 'PU_SIG → GP26 / ADC0', { size: 11, bold: true, color: C.sense });
text(1216, 211, '(pin 31): waveform', { size: 10, color: C.dim });

// ---------------------------------------------------------------- E: bias generator
box(20, 450, 560, 260, { fill: '#f0fdfa', stroke: '#0f766e', dashed: true, label: '4 · V_BIAS generator', size: 12 });
rail(100, 475, '3V3A');
wire([[100, 475], [100, 480]], C.bias);
resistorV(100, 480, C.bias); text(116, 525, 'R_A 10 kΩ', { size: 9, color: C.dim });
dot(100, 560, C.bias);
resistorV(100, 560, C.bias); text(116, 605, 'R_B 10 kΩ', { size: 9, color: C.dim }); ground(100, 640);
wire([[100, 560], [160, 560]], C.bias); dot(160, 560, C.bias);
capacitor(160, 560); wire([[160, 590], [160, 596]]); ground(160, 596);
text(146, 551, 'C_B 1 µF', { size: 9, color: C.dim });
const u1a = opamp(230, 520, 'U1A  MCP6002 (buffer)');
wire([[160, 560], [200, 560], [200, u1a.inP[1]], [u1a.inP[0], u1a.inP[1]]], C.bias);
wire([[u1a.inN[0], u1a.inN[1]], [215, u1a.inN[1]], [215, 610], [330, 610], [330, u1a.out[1]], [u1a.out[0], u1a.out[1]]], C.bias);
dot(310, u1a.out[1], C.bias);
wire([[310, u1a.out[1]], [310, 415]], C.bias);
text(350, 560, 'supplies the bottom legs\n(up to ±0.5 mA): needs a\nlow-impedance source', { size: 9, color: C.dim });

// ---------------------------------------------------------------- D: comparators and DAC
box(600, 450, 940, 260, { fill: '#faf5ff', stroke: '#7c3aed', dashed: true, label: '5 · Edge detection (PIO) + threshold DAC', size: 12 });
const dac = icBox(640, 490, 170, 'U4  MCP4822 (2-ch DAC)', ['SCK (GP18)', 'SDI (GP19)', 'CS (GP17)', 'LDAC → GND'], ['VOUTA', 'VOUTB'], { pitch: 24 });
wire([dac.pins.VOUTA, [dac.pins.VOUTA[0] + 24, dac.pins.VOUTA[1]]], C.dig);
text(dac.pins.VOUTA[0] + 28, dac.pins.VOUTA[1] + 4, 'VTHP', { size: 11, bold: true, color: C.dig });
wire([dac.pins.VOUTB, [dac.pins.VOUTB[0] + 24, dac.pins.VOUTB[1]]], C.dig);
text(dac.pins.VOUTB[0] + 28, dac.pins.VOUTB[1] + 4, 'VTHN', { size: 11, bold: true, color: C.dig });
text(640, 640, 'VDD 3V3A, internal 2.048 V reference, gain ×1.\nVTHP = V_BIAS + x,  VTHN = V_BIAS − x  (x set by firmware,\ntypically 5–25 % of full scale). Window 1.25–2.05 V.', { size: 9, color: C.dim });

const cmpA = opamp(1200, 500, 'U3A', {});
const cmpB = opamp(1200, 630, 'U3B', { plusTop: false });
wire([[1070, 200], [1070, 645]], C.sense);
dot(1070, cmpA.inP[1], C.sense); wire([[1070, cmpA.inP[1]], cmpA.inP], C.sense);
dot(1070, cmpB.inN[1], C.sense); wire([[1070, cmpB.inN[1]], cmpB.inN], C.sense);
wire([cmpA.inN, [1176, cmpA.inN[1]]], C.dig); text(1172, cmpA.inN[1] + 4, 'VTHP', { size: 10, anchor: 'end', bold: true, color: C.dig });
wire([cmpB.inP, [1176, cmpB.inP[1]]], C.dig); text(1172, cmpB.inP[1] + 4, 'VTHN', { size: 10, anchor: 'end', bold: true, color: C.dig });
for (const [cmp, label, rtop] of [[cmpA, '→ GP2 (PU_POS)', 450], [cmpB, '→ GP3 (PU_NEG)', 580]]) {
  rail(1330, rtop - 4, '3V3A'); resistorV(1330, rtop, C.dig); text(1346, rtop + 44, 'R 10 kΩ\n(DNP if push-pull)', { size: 9, color: C.dim });
  wire([cmp.out, [1330, cmp.out[1]]], C.dig); dot(1330, cmp.out[1], C.dig);
  wire([[1330, cmp.out[1]], [1360, cmp.out[1]]], C.dig);
  text(1366, cmp.out[1] + 4, label, { size: 11, bold: true, color: C.dig });
}
text(640, 684, 'U3 footprint: dual comparator, SOIC-8, standard pinout\n(TLV3202 or MCP6542; pull-ups DNP for push-pull parts).', { size: 9, color: C.dim });

// ---------------------------------------------------------------- F: optional peak hold
box(20, 735, 1500, 235, { fill: '#f8fafc', stroke: '#94a3b8', dashed: true, label: '6 · Optional peak hold (footprints, DNP until needed)', size: 12 });
// PK+
text(40, 802, 'OUT', { size: 11, bold: true, color: C.sense });
wire([[70, 798], [150, 798]], C.sense); wire([[150, 798], [150, 810]], C.sense);
diodeDown(150, 810); wire([[150, 840], [150, 870]], C.dig); dot(150, 870, C.dig);
wire([[150, 870], [350, 870]], C.dig);
dot(200, 870, C.dig); capacitor(200, 870); wire([[200, 900], [200, 906]]); ground(200, 906);
text(186, 892, 'C_PK 10 nF', { size: 9, anchor: 'end', color: C.dim });
dot(255, 870, C.dig); resistorV(255, 870, C.dig); ground(255, 954);
text(271, 920, 'R_BL 10 MΩ', { size: 9, color: C.dim });
dot(310, 870, C.dig); resistorV(310, 790, C.dig); wire([[310, 790], [310, 782]], C.dig);
text(326, 810, 'R_RST 1 kΩ', { size: 9, color: C.dim });
text(326, 780, 'PU_PKRST_P  (EXP1.A6)', { size: 9, color: C.dig, bold: true });
text(360, 874, '→ GP27 (PU_PKP)', { size: 11, bold: true, color: C.dig });
text(168, 830, 'D4', { size: 10, color: C.clamp, bold: true });
// PK−
text(560, 802, 'OUT', { size: 11, bold: true, color: C.sense });
wire([[590, 798], [650, 798]], C.sense); wire([[650, 798], [650, 810]], C.sense);
diodeUp(650, 810); wire([[650, 840], [650, 870]], C.dig); dot(650, 870, C.dig);
wire([[650, 870], [850, 870]], C.dig);
dot(700, 870, C.dig); capacitor(700, 840); wire([[700, 840], [700, 836]], C.dig); rail(700, 832, '3V3A');
text(716, 862, 'C_PK 10 nF', { size: 9, color: C.dim });
dot(755, 870, C.dig); wire([[755, 870], [755, 860]], C.dig); resistorV(755, 780, C.dig); rail(755, 776, '3V3A');
text(771, 820, 'R_BL 10 MΩ', { size: 9, color: C.dim });
dot(810, 870, C.dig); resistorV(810, 870, C.dig);
text(826, 920, 'R_RST 1 kΩ', { size: 9, color: C.dim });
text(826, 950, 'PU_PKRST_N  (EXP1.A7)', { size: 9, color: C.dig, bold: true });
text(860, 874, '→ GP28 (PU_PKN)', { size: 11, bold: true, color: C.dig });
text(666, 830, 'D5', { size: 10, color: C.clamp, bold: true });
text(1000, 800, 'Catches narrow pulses that the sampled waveform could miss.\nD4 / D5 = BAT54 (Schottky). The diode drop (about 0.25 V) is\ncalibrated out by the self-test. Reset: drive the 1 kΩ reset line\nlow (PK+) or high (PK−) for 1 ms, then back to high-Z.', { size: 10, color: C.dim });

// ---------------------------------------------------------------- notes
box(20, 985, 760, 112, { fill: '#f8fafc', stroke: '#94a3b8' });
text(32, 1006, 'Notes', { size: 12, bold: true });
text(32, 1024, '• Ranges: S1 → R_B5 (±5 V), S2 → R_B20 (±20 V), S3 → R_B100 (±100 V). Node swing ±1.5 V = full scale. Only one switch on at a time.\n' +
  '• R_T1 + R_T2 = 200 kΩ: two 0.6 W metal-film resistors in series (about 350 V each), so a wrong 400 V connection only draws about 2 mA.\n' +
  '• Self-test: with the clips open, PU_TEST drives 3.3 V / 0 V through R_INJ. Expected output steps: 0.56 V (±5 V), 0.12 V (±20 V), 23 mV (±100 V).\n' +
  '• 3V3A = 3V3 through 10 Ω, 10 µF and 100 nF. IC supply pins have 100 nF each. Pickup frequency range: DC to about 20 kHz.', { size: 9.5, color: '#334155' });
box(800, 985, 720, 112, { fill: '#ffedd5', stroke: '#ea580c' });
text(812, 1006, '⚠ Pickup coils only. Never connect IN+ / IN− to a CDI output or an ignition coil.', { size: 12, bold: true, color: '#9a3412' });
text(812, 1024, 'A pickup can reach tens of volts at speed. The TVS, R_T1/R_T2 and the clamp protect against that, not against a CDI output\n(200–400 V pulses) or HT. Keep the pickup disconnected from the CDI while testing. See docs/safety.md.\nThe clamp diodes sit on a plug-in header so they can be replaced without desoldering.', { size: 9.5, color: '#9a3412' });

s.finish('ch-pu-schematic.drawio.svg', 'CH-PU schematic');
