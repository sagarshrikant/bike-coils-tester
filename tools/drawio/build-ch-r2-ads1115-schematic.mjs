#!/usr/bin/env node
// Builds hardware/diagrams/ch-r2-ads1115-schematic.drawio.svg (CH-R2 for the PCB, sensed by the ADS1115).
// Usage: node tools/drawio/build-ch-r2-ads1115-schematic.mjs [--force]
// Once the file exists the .drawio.svg is the source of truth: do not overwrite it without --force.
import { createSchematic, C } from './schematic-lib.mjs';

const W = 1400, H = 900;
const s = createSchematic({ W, H, title: 'CH-R2 with ADS1115' });
const { wire, dot, text, box, resistorH, resistorV, capacitor, diodeUp, tvs, ground, rail, terminal, switchV, icBox } = s;

text(20, 28, 'CH-R2 2-wire resistance meter, PCB version: sensed by the ADS1115 · schematic (PROPOSED)', { size: 18, bold: true });
text(20, 48, 'R_dut = R_REF · V_node / (V_top − V_node). Same circuit as the Phase 1 perfboard, but the three voltages are read by a 16-bit ADC with one shared reference, and a self-test path is added.', { size: 11, color: C.dim });

// ---- Pico pins and the two ranges
box(20, 70, 140, 420, { fill: '#eff6ff', stroke: '#2563eb', dashed: true, label: 'Pico 2 W', size: 12 });
text(30, 144, 'GP14 (pin 19)\nR2_DRIVE_1K', { size: 10, bold: true, color: C.drv });
text(30, 344, 'GP15 (pin 20)\nR2_DRIVE_10K', { size: 10, bold: true, color: C.drv });
for (const [y, name, tag, val, range] of [[140, 'R_REF1', 'AIN1', '1 kΩ 0.1 %', '1k range  (≤ 3.3 mA)'], [340, 'R_REF2', 'AIN2', '10 kΩ 0.1 %', '10k range  (≤ 0.33 mA)']]) {
  wire([[160, y], [300, y]], C.drv);
  dot(230, y, C.drv);
  resistorH(300, y, C.drv);
  text(340, y - 22, `${name}  ${val}`, { size: 12, anchor: 'middle', bold: true });
  text(340, y + 24, range, { size: 10, anchor: 'middle', color: C.dim });
  wire([[380, y], [620, y]], C.drv);
  // top-sense filter: 1 kΩ + 100 nF, to the ADS1115
  wire([[230, y], [230, y + 30]], C.sense);
  resistorV(230, y + 30, C.sense); text(244, y + 76, 'R 1 kΩ', { size: 9, color: C.dim });
  dot(230, y + 110, C.sense);
  wire([[230, y + 110], [290, y + 110]], C.sense); dot(290, y + 110, C.sense);
  capacitor(290, y + 110); ground(290, y + 142);
  text(306, y + 132, 'C 100 nF', { size: 9, color: C.dim });
  wire([[290, y + 110], [330, y + 110]], C.sense);
  text(336, y + 114, `V_TOP${range.startsWith('1k') ? '1K' : '10K'}  → ADS1115 ${tag}`, { size: 10, bold: true, color: C.sense });
}
dot(620, 140, C.drv); dot(620, 340, C.drv);
wire([[620, 140], [620, 714]], C.drv);
text(634, 232, 'DUT+ node', { size: 11, bold: true });
text(634, 247, '(V_node)', { size: 10, color: C.dim });

// ---- node sense: R_S, clamp header, filter
dot(620, 560, C.drv);
wire([[620, 560], [640, 560]], C.sense);
resistorH(640, 560, C.sense); text(680, 540, 'R_S 1 kΩ', { size: 10, anchor: 'middle', bold: true });
wire([[720, 560], [740, 560]], C.sense); dot(740, 560, C.sense);
rail(740, 480, '3V3A'); wire([[740, 480], [740, 490]], C.clamp);
diodeUp(740, 490); wire([[740, 520], [740, 560]], C.clamp);
wire([[740, 560], [740, 575]], C.clamp); diodeUp(740, 575); wire([[740, 605], [740, 615]], C.clamp); ground(740, 615);
text(756, 530, 'D2 / D3 = BAT54S\non plug-in header', { size: 9, color: C.clamp, bold: true });
dot(800, 560, C.sense); wire([[740, 560], [800, 560]], C.sense);
capacitor(800, 560); ground(800, 592);
text(816, 584, 'C1 100 nF', { size: 9, color: C.dim });
wire([[800, 560], [860, 560]], C.sense);
text(866, 564, 'V_NODE  → ADS1115 AIN0', { size: 10, bold: true, color: C.sense });

// ---- self-test reference resistors (photoMOS + precision resistor across the DUT terminals)
for (const [x, tag, val, ctrl] of [[500, 'PR3', 'R_CAL1 470 Ω 0.1 %', 'EXP2.A6'], [380, 'PR4', 'R_CAL2 47 kΩ 0.1 %', 'EXP2.A7']]) {
  dot(x, 470, C.drv); switchV(x, 478, '');
  wire([[x, 470], [x, 478]], C.drv);
  wire([[x, 518], [x, 530]]); resistorV(x, 530); ground(x, 614);
  text(x - 12, 500, `${tag}  ${ctrl}\nphotoMOS`, { size: 9, anchor: 'end', bold: true, color: C.dig });
  text(x - 12, 570, val.replace(' ', '\n'), { size: 9, anchor: 'end', color: C.dim });
}
wire([[620, 470], [380, 470]], C.drv);

// ---- overvoltage protection and the DUT terminals
wire([[620, 620], [670, 620]], C.drv); dot(620, 620, C.drv); dot(670, 620, C.drv);
tvs(670, 620); ground(670, 682);
text(684, 654, 'D7 TVS\n5 V bidirectional', { size: 9, color: C.clamp, bold: true });
terminal(620, 720, C.drv); text(634, 724, 'DUT+  (red clip)', { size: 11, bold: true, color: C.drv });
terminal(540, 720, C.gnd); text(526, 724, 'DUT−  (black clip)', { size: 11, anchor: 'end', bold: true });
wire([[546, 720], [580, 720]], C.gnd); dot(580, 720, C.gnd); ground(580, 722);

// ---- ADS1115
box(930, 70, 450, 420, { fill: '#f0fdf4', stroke: '#16a34a', dashed: true, label: 'JM1  ADS1115 module (I²C 0x48), typical pin order', size: 12 });
const ads = icBox(980, 150, 150, 'ADS1115 module', ['(7) A0', '(8) A1', '(9) A2', '(10) A3'], ['(4) SDA', '(3) SCL', '(5) ADDR', '(6) ALRT', '(1) VDD', '(2) GND'], { pitch: 26 });
for (const [pin, label] of [['(7) A0', 'V_NODE'], ['(8) A1', 'V_TOP1K'], ['(9) A2', 'V_TOP10K']]) {
  const [x, y] = ads.pins[pin];
  wire([[x, y], [x - 24, y]], C.sense);
  text(x - 28, y + 4, label, { size: 10, anchor: 'end', bold: true, color: C.sense });
}
{ const [x, y] = ads.pins['(10) A3']; wire([[x, y], [x - 24, y]]); text(x - 28, y + 4, 'spare (test pad)', { size: 9, anchor: 'end', color: C.dim }); }
const sda = ads.pins['(4) SDA'], scl = ads.pins['(3) SCL'];
wire([sda, [1290, sda[1]]], C.dig); text(1296, sda[1] + 4, 'SDA ← GP4', { size: 10, bold: true, color: C.dig });
wire([scl, [1290, scl[1]]], C.dig); text(1296, scl[1] + 4, 'SCL ← GP5', { size: 10, bold: true, color: C.dig });
text(1180, 120, 'SDA and SCL: 4.7 kΩ pull-ups to 3V3\n(once per board, on the mainboard I²C bus)', { size: 9, color: C.dim });
const addr = ads.pins['(5) ADDR']; wire([addr, [addr[0] + 24, addr[1]]]); ground(addr[0] + 24, addr[1]);
text(addr[0] + 44, addr[1] + 4, 'ADDR = GND → 0x48', { size: 9, color: C.dim });
const alert = ads.pins['(6) ALRT']; wire([alert, [alert[0] + 24, alert[1]]], C.dig);
text(alert[0] + 30, alert[1] + 4, 'ALERT/RDY → test pad', { size: 9, color: C.dim });
const vdd = ads.pins['(1) VDD'], gnd = ads.pins['(2) GND'];
wire([vdd, [vdd[0] + 90, vdd[1]]], C.clamp); rail(vdd[0] + 90, vdd[1], '3V3A'); dot(vdd[0] + 40, vdd[1], C.clamp);
capacitor(vdd[0] + 40, vdd[1]); wire([[vdd[0] + 40, vdd[1] + 30], [vdd[0] + 40, gnd[1]]]);
wire([gnd, [gnd[0] + 90, gnd[1]]]); dot(gnd[0] + 40, gnd[1]); ground(gnd[0] + 90, gnd[1]);
text(vdd[0] + 52, vdd[1] + 44, 'C 100 nF + 1 µF, close to VDD', { size: 9, color: C.dim });
text(960, 420, 'Single-ended inputs, PGA ±4.096 V (±0.512 V for the node on low ohms), 128–860 SPS.\nThe ADS1115 is a breakout module on header JM1 (pin order to be confirmed).\nThe CH-TG power side has its own module (0x49) on JM2.', { size: 9, color: C.dim });

// ---- notes
box(20, 775, 760, 115, { fill: '#f8fafc', stroke: '#94a3b8' });
text(32, 796, 'Notes', { size: 12, bold: true });
text(32, 814, '• Read order per range: V_top, V_node, V_top again. Only one drive pin is high at a time, the other is INPUT.\n' +
  '  Turn-off: drive the pin LOW for 20 ms, then INPUT.\n' +
  '• Self-test (clips open): close PR3, measure on the 1k range (expect 470 Ω ± 3 %); then PR4 on the 10k range\n' +
  '  (47 kΩ ± 3 %). Open both afterwards.\n' +
  '• R 1 kΩ + C 100 nF on each top-sense line: charge reservoir for the ADC input. Settling is about 100 µs.\n' +
  '• R_REF1 / R_REF2: 0.1 % parts. 1 % parts work if their measured values go into hw_pins.py.', { size: 9.5, color: '#334155' });
box(800, 775, 580, 115, { fill: '#ffedd5', stroke: '#ea580c' });
text(812, 796, '⚠ Resistance of coils at rest only (≤ 3.3 V)', { size: 12, bold: true, color: '#9a3412' });
text(812, 814, 'Never connect the DUT clips to a coil that is wired to a CDI, to a spinning pickup, or to any CDI output or\nignition coil. The TVS and clamp handle static and the turn-off kick only. A pickup that is spun produces tens of\nvolts: use CH-PU for that. See docs/safety.md.', { size: 9.5, color: '#9a3412' });

s.finish('ch-r2-ads1115-schematic.drawio.svg', 'CH-R2 with ADS1115');
