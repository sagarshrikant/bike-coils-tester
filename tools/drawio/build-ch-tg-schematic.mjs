#!/usr/bin/env node
// Builds hardware/diagrams/ch-tg-schematic.drawio.svg (CH-TG: CDI trigger simulator, with the isolated measurement bus).
// Usage: node tools/drawio/build-ch-tg-schematic.mjs [--force]
// Once the file exists the .drawio.svg is the source of truth: do not overwrite it without --force.
// Same-named nets (S, OUT, SHUT, SDA_P ...) are connected, as in a KiCad schematic.
import { createSchematic, C } from './schematic-lib.mjs';

const W = 1600, H = 1330;
const s = createSchematic({ W, H, title: 'CH-TG trigger simulator' });
const { wire, dot, text, box, resistorH, resistorV, tvs, ground, rail, terminal, opamp, icBox } = s;

text(20, 28, 'CH-TG: CDI trigger simulator with isolated measurement bus · schematic (PROPOSED, Phase 3)', { size: 18, bold: true });
text(20, 48, 'Pulse = CD4052B analog mux switching between V_AMP+, V_AMP− and GND (amplitude set by DACs, verified by an ADS1115 on an isolated I²C segment). Everything on the left lives in the 12 V power domain; the Pico only reaches it through isolators.', { size: 11, color: C.dim });

box(20, 70, 1010, 1100, { fill: '#fff7ed', stroke: '#ea580c', dashed: true, label: '12 V POWER DOMAIN (ground = GND_P)  ·  live only when armed, except the always-on parts marked 3V3_P', size: 12 });
box(1080, 70, 500, 1100, { fill: '#eff6ff', stroke: '#2563eb', dashed: true, label: 'LOGIC DOMAIN (Pico 2 W, ground = GND_L)', size: 12 });
text(1055, 98, 'isolation\nbarrier', { size: 9, anchor: 'middle', color: C.dim, bold: true });

const gl = (x, y) => { wire([[x, y], [x - 16, y]]); ground(x - 16, y); };   // pin stub to ground
const nl = (x, y, label, color = C.ink, side = 'l') => {                    // pin stub with a net name
  if (side === 'l') { wire([[x, y], [x - 20, y]], color); text(x - 24, y + 4, label, { size: 10, anchor: 'end', bold: true, color }); }
  else { wire([[x, y], [x + 20, y]], color); text(x + 24, y + 4, label, { size: 10, bold: true, color }); }
};

// ================================================================ 1: supplies
box(40, 100, 440, 300, { fill: '#fffbeb', stroke: '#ca8a04', dashed: true, label: '1 · Supplies', size: 12 });
const u10 = icBox(140, 150, 80, 'U10  78L05', ['IN', 'GND'], ['OUT'], { pitch: 26 });
nl(u10.pins.IN[0], u10.pins.IN[1], '12V_RAW', C.drv); gl(u10.pins.GND[0], u10.pins.GND[1]);
const u11 = icBox(280, 150, 110, 'U11  3.3 V LDO', ['IN', 'GND'], ['OUT'], { pitch: 26 });
wire([u10.pins.OUT, u11.pins.IN]); text(228, u10.pins.OUT[1] - 6, '5V_RAW', { size: 9, bold: true, color: C.dim });
gl(u11.pins.GND[0], u11.pins.GND[1]); nl(u11.pins.OUT[0], u11.pins.OUT[1], '3V3_P', C.clamp, 'r');
text(60, 250, 'Always on (from 12V_RAW): the isolator, the ADS1115 and the DACs\nwork before arming, so the firmware can check the power side\nwhile it is still dead.', { size: 9, color: C.dim });
const u12 = icBox(140, 285, 80, 'U12  78L05', ['IN', 'GND'], ['OUT'], { pitch: 26 });
nl(u12.pins.IN[0], u12.pins.IN[1], '12V_ARMED', C.drv); gl(u12.pins.GND[0], u12.pins.GND[1]);
const u13 = icBox(280, 285, 110, 'U13  ICL7660', ['V+', 'GND'], ['VOUT'], { pitch: 26 });
wire([u12.pins.OUT, u13.pins['V+']]); text(228, u12.pins.OUT[1] - 6, '+5V_P', { size: 9, bold: true, color: C.dim });
gl(u13.pins.GND[0], u13.pins.GND[1]); nl(u13.pins.VOUT[0], u13.pins.VOUT[1], '−5V_P', C.sense, 'r');
text(60, 380, 'U13: 10 µF on CAP+/CAP−, 10 µF out.\nU12 78L05 feeds the pump; the mux\nsupply is U20 (+9V_P), chosen with JP1.', { size: 9, color: C.dim });

// ================================================================ 2: ADS1115 on the isolated bus + monitors
box(500, 100, 520, 290, { fill: '#f0fdf4', stroke: '#16a34a', dashed: true, label: '2 · Power-side measurement (ADS1115 0x49)', size: 12 });
const ads = icBox(640, 150, 130, 'JM2  ADS1115 module (0x49)', ['A0', 'A1', 'A2', 'A3'], ['SDA', 'SCL', 'VDD', 'GND', 'ADDR'], { pitch: 26 });
nl(ads.pins.A0[0], ads.pins.A0[1], 'V_OUT_M', C.sense); nl(ads.pins.A1[0], ads.pins.A1[1], 'V_AMPP_M', C.sense);
nl(ads.pins.A2[0], ads.pins.A2[1], 'V_AMPN_M', C.sense); nl(ads.pins.A3[0], ads.pins.A3[1], 'V_ARM_M', C.sense);
nl(ads.pins.SDA[0], ads.pins.SDA[1], 'SDA_P', C.dig, 'r'); nl(ads.pins.SCL[0], ads.pins.SCL[1], 'SCL_P', C.dig, 'r');
nl(ads.pins.VDD[0], ads.pins.VDD[1], '3V3_P', C.clamp, 'r'); gl(ads.pins.GND[0], ads.pins.GND[1]);
nl(ads.pins.ADDR[0], ads.pins.ADDR[1], '3V3_P (0x49)', C.clamp, 'r');
text(516, 346, 'Level-shifting dividers (values in the doc):\n V_OUT_M = OUT × 0.17 + 1.0 V   (−5 … +12 V → 0.15 … 3.1 V)\n V_AMPP_M = V_AMP+ ÷ 3.3     V_AMPN_M = V_AMP− × 0.4 + 2.0 V\n V_ARM_M = 12V_ARMED × 0.21', { size: 9, color: '#334155' });

// ================================================================ 3: DACs and amplifiers
box(40, 410, 450, 425, { fill: '#faf5ff', stroke: '#7c3aed', dashed: true, label: '3 · Amplitude: DAC + op-amp per polarity', size: 12 });
const dacL = ['SDA_P', 'SCL_P', '3V3_P', 'GND', 'A0'];
const stubRail = (p, name) => { wire([p, [p[0] - 16, p[1]]], C.clamp); wire([[p[0] - 28, p[1] - 4 + 4], [p[0] - 16, p[1]]], C.clamp); };
const d1 = icBox(70, 440, 110, 'U16 MCP4725\n(0x60)', dacL, ['VOUT'], { pitch: 24 });
const d2 = icBox(70, 630, 110, 'U17 MCP4725\n(0x61)', dacL, ['VOUT'], { pitch: 24 });
for (const [d, a0gnd] of [[d1, true], [d2, false]]) {
  wire([d.pins.SDA_P, [d.pins.SDA_P[0] - 6, d.pins.SDA_P[1]]], C.dig); wire([d.pins.SCL_P, [d.pins.SCL_P[0] - 6, d.pins.SCL_P[1]]], C.dig);
  wire([d.pins['3V3_P'], [d.pins['3V3_P'][0] - 4, d.pins['3V3_P'][1]]], C.clamp); gl(d.pins.GND[0], d.pins.GND[1]);
  if (a0gnd) gl(d.pins.A0[0], d.pins.A0[1]); else wire([d.pins.A0, [d.pins.A0[0] - 4, d.pins.A0[1]]], C.clamp);
}
// amplifier A: non-inverting, gain 3 (DAC 0-3.3 V -> V_AMP+ 0-9.9 V)
const oa = opamp(270, 460, '', { w: 70, h: 60 });
text(282, 540, 'U18A  TL072', { size: 10, bold: true });
wire([d1.pins.VOUT, [230, d1.pins.VOUT[1]], [230, oa.inP[1]], oa.inP], C.dig);
wire([oa.inN, [250, oa.inN[1]]]); dot(250, oa.inN[1]);
resistorV(250, oa.inN[1]); ground(250, oa.inN[1] + 82); text(264, oa.inN[1] + 46, 'R_G 10 kΩ', { size: 9, color: C.dim });
wire([[250, oa.inN[1]], [250, 450], [260, 450]]);
resistorH(260, 450); text(300, 438, 'R_F 20 kΩ', { size: 9, anchor: 'middle', color: C.dim });
wire([[340, 450], [365, 450], [365, oa.out[1]]]); wire([oa.out, [420, oa.out[1]]], C.drv); dot(365, oa.out[1], C.drv);
text(424, oa.out[1] - 6, 'V_AMP+', { size: 11, bold: true, color: C.drv });
// amplifier B: inverting, gain -1 (DAC 0-3.3 V -> V_AMP- 0 ... -3.3 V)
const ob = opamp(320, 650, '', { w: 70, h: 60, plusTop: false });
text(332, 730, 'U18B  TL072', { size: 10, bold: true });
wire([d2.pins.VOUT, [210, d2.pins.VOUT[1]], [210, ob.inN[1]], [220, ob.inN[1]]], C.dig);
resistorH(220, ob.inN[1]); text(260, ob.inN[1] - 14, 'R_IN 10 kΩ', { size: 9, anchor: 'middle', color: C.dim });
wire([[300, ob.inN[1]], ob.inN]); dot(308, ob.inN[1]);
wire([[308, ob.inN[1]], [308, 630], [318, 630]]);
resistorH(318, 630); text(358, 618, 'R_F 10 kΩ', { size: 9, anchor: 'middle', color: C.dim });
wire([[398, 630], [420, 630], [420, ob.out[1]]]); wire([ob.out, [470, ob.out[1]]], C.sense); dot(420, ob.out[1], C.sense);
text(426, ob.out[1] - 6, 'V_AMP−', { size: 11, bold: true, color: C.sense });
wire([ob.inP, [300, ob.inP[1]]]); ground(300, ob.inP[1]);
text(60, 798, 'U18 TL072: V+ = 12V_ARMED, V− = −5V_P (swing about +10 V / −3.5 V). V_AMP+ is\nkept below 8 V in firmware (mux VDD = +9 V). The buses are stiff\nDC levels. The mux connects them to the output only for the pulse width.', { size: 9, color: C.dim });

// ================================================================ 4: mux
box(500, 410, 280, 510, { fill: '#fefce8', stroke: '#ca8a04', dashed: true, label: '4 · Pulse mux (CD4052B)', size: 12 });
const mux = icBox(540, 440, 140, 'U19  CD4052B', ['X0', 'X1', 'X2', 'X3', 'A', 'B', 'INH'], ['X', 'VDD', 'VEE', 'VSS'], { pitch: 26 });
gl(mux.pins.X0[0], mux.pins.X0[1]);
nl(mux.pins.X1[0], mux.pins.X1[1], 'V_AMP−', C.sense); nl(mux.pins.X2[0], mux.pins.X2[1], 'V_AMP+', C.drv);
gl(mux.pins.X3[0], mux.pins.X3[1]);
nl(mux.pins.A[0], mux.pins.A[1], 'MUX_A', C.dig); nl(mux.pins.B[0], mux.pins.B[1], 'MUX_B', C.dig); nl(mux.pins.INH[0], mux.pins.INH[1], 'MUX_INH', C.dig);
nl(mux.pins.X[0], mux.pins.X[1], 'S', C.drv, 'r');
{ const [vx, vy] = mux.pins.VDD;
  wire([[vx, vy], [750, vy]], C.drv); text(702, vy + 16, 'MUX_VDD', { size: 9, bold: true, color: C.drv });
  terminal(756, vy - 20, C.clamp); terminal(756, vy, C.drv); terminal(756, vy + 20, C.drv);
  wire([[756, vy], [756, vy + 20]], C.drv); wire([[752, vy + 20], [760, vy + 20]], C.drv);
  text(768, vy - 16, 'JP1.1  +5V_P  (alternative)', { size: 9, bold: true, color: C.clamp });
  text(768, vy + 24, 'JP1.3  +9V_P  (default: jumper 2–3)', { size: 9, bold: true, color: C.drv }); }
nl(mux.pins.VEE[0], mux.pins.VEE[1], '−5V_P', C.sense, 'r'); gl(mux.pins.VSS[0], mux.pins.VSS[1]);
text(512, 690, 'Select (B A):\n 11 = X3 = GND: idle, and the default when\n      the optocouplers are off\n 10 = X2 = V_AMP+: positive pulse (A on)\n 01 = X1 = V_AMP−: negative pulse (B on)\n 00 = X0 = GND\nINH pulled to MUX_VDD = all switches open (default).\nVDD +9 V, VEE −5 V = 14 V (limit 15 V for the\n3–15 V part). Y section: all pins to GND_P.', { size: 9, color: '#334155' });
const u20 = icBox(600, 815, 100, 'U20  78L09', ['IN', 'GND'], ['OUT'], { pitch: 26 });
nl(u20.pins.IN[0], u20.pins.IN[1], '12V_ARMED', C.drv); gl(u20.pins.GND[0], u20.pins.GND[1]); nl(u20.pins.OUT[0], u20.pins.OUT[1], '+9V_P', C.drv, 'r');

// ================================================================ 5: output, 6: kill
box(40, 845, 450, 315, { fill: '#fff1f2', stroke: '#dc2626', dashed: true, label: '5 · Output and CDI connector', size: 12 });
terminal(80, 900, C.drv); text(60, 884, 'J5.1  TRIG+  (blue / white wire)', { size: 10, bold: true, color: C.drv });
wire([[86, 900], [260, 900]], C.drv); dot(200, 900, C.drv);
text(266, 904, 'OUT', { size: 11, bold: true, color: C.drv });
tvs(200, 900); ground(200, 964); text(214, 936, 'D8  TVS 15 V\nbidirectional', { size: 9, color: C.clamp, bold: true });
terminal(80, 1020, C.dig); text(60, 1004, 'J5.2  SHUT DOWN', { size: 10, bold: true, color: C.dig });
wire([[86, 1020], [260, 1020]], C.dig); text(266, 1024, 'SHUT', { size: 11, bold: true, color: C.dig });
terminal(80, 1090, C.gnd); text(60, 1074, 'J5.3  GND  (green wires, CDI ground)', { size: 10, bold: true });
wire([[86, 1090], [120, 1090]], C.gnd); ground(120, 1090);
text(60, 1128, 'CDI POWER + comes from J3 (12V_ARMED, 2 A fuse). The CDI IGNITION wire goes\nstraight to the coil primary, not to this board. Idle: OUT sits at 0 V through the\nselected source resistor, like a pickup coil at rest.', { size: 9, color: C.dim });

// ================================================================ barrier devices
const BX = 950;
const logicFeed = (x, y, label) => {  // logic side of an LED-driven device: resistor from a GPIO / expander line
  wire([[x, y], [1096, y]], C.dig); resistorH(1096, y, C.dig);
  text(1136, y - 12, 'R 330 Ω', { size: 9, anchor: 'middle', color: C.dim });
  wire([[1176, y], [1200, y]], C.dig); text(1206, y + 4, label, { size: 10, bold: true, color: C.dig });
};
// U14 isolator
const iso = icBox(BX, 110, 80, 'U14\nADuM1250', ['VDD2', 'SDA2', 'SCL2', 'GND2'], ['VDD1', 'SDA1', 'SCL1', 'GND1'], { pitch: 26 });
nl(iso.pins.VDD2[0], iso.pins.VDD2[1], '3V3_P', C.clamp); nl(iso.pins.SDA2[0], iso.pins.SDA2[1], 'SDA_P', C.dig); nl(iso.pins.SCL2[0], iso.pins.SCL2[1], 'SCL_P', C.dig); gl(iso.pins.GND2[0], iso.pins.GND2[1]);
wire([iso.pins.VDD1, [1096, iso.pins.VDD1[1]]], C.clamp); text(1102, iso.pins.VDD1[1] + 4, '3V3 (logic)', { size: 10, bold: true, color: C.clamp });
wire([iso.pins.SDA1, [1096, iso.pins.SDA1[1]]], C.dig); text(1102, iso.pins.SDA1[1] + 4, 'SDA  ↔  GP4  (main I²C bus)', { size: 10, bold: true, color: C.dig });
wire([iso.pins.SCL1, [1096, iso.pins.SCL1[1]]], C.dig); text(1102, iso.pins.SCL1[1] + 4, 'SCL  ↔  GP5', { size: 10, bold: true, color: C.dig });
wire([iso.pins.GND1, [1070, iso.pins.GND1[1]]]); ground(1070, iso.pins.GND1[1]);
text(1100, 270, 'Isolated I²C segment: SDA_P / SCL_P with 4.7 kΩ pull-ups to 3V3_P.\nOn the logic side, the main bus continues to the ADS1115 (0x48) and the MCP23017s.', { size: 9, color: C.dim });

// opto drivers for the mux
const opto = (y, title, net, logicLabel) => {
  const d = icBox(BX, y, 80, title, ['C', 'E'], ['A', 'K'], { pitch: 26 });
  const [cx, cy] = d.pins.C;
  wire([[cx, cy], [910, cy]], C.dig); dot(910, cy, C.dig);
  wire([[910, cy], [900, cy]], C.dig); resistorH(820, cy, C.drv);
  text(816, cy + 4, 'MUX_VDD', { size: 9, anchor: 'end', bold: true, color: C.drv });
  text(860, cy - 12, `R 4.7 kΩ  →  ${net}`, { size: 9, anchor: 'middle', bold: true, color: C.dig });
  gl(d.pins.E[0], d.pins.E[1]);
  logicFeed(d.pins.A[0], d.pins.A[1], logicLabel);
  wire([d.pins.K, [1070, d.pins.K[1]]]); ground(1070, d.pins.K[1]);
};
opto(290, 'PC817\nPULSE A', 'MUX_A', '← GP6  TG_PULSE_A  (positive pulse)');
opto(400, 'PC817\nPULSE B', 'MUX_B', '← GP7  TG_PULSE_B  (negative pulse)');
opto(515, 'PC817\nENABLE', 'MUX_INH', '← EXP1.B7  TG_EN  (on = enabled)');

// photoMOS: source impedance bank and kill outputs
const pmos = (y, title, sNet, rVal, farNet, logicLabel, farColor) => {
  const d = icBox(BX, y, 80, title, ['S1', 'S2'], ['A', 'K'], { pitch: 26 });
  nl(d.pins.S1[0], d.pins.S1[1], sNet, C.drv);
  const [x2, y2] = d.pins.S2;
  wire([[x2, y2], [900, y2]], C.drv); resistorH(820, y2, C.drv);
  text(860, y2 - 12, rVal, { size: 9, anchor: 'middle', color: C.dim });
  if (farNet === 'GND') { wire([[820, y2], [800, y2]]); ground(800, y2); }
  else { wire([[820, y2], [800, y2]], farColor); text(796, y2 + 4, farNet, { size: 10, anchor: 'end', bold: true, color: farColor }); }
  logicFeed(d.pins.A[0], d.pins.A[1], logicLabel);
  wire([d.pins.K, [1070, d.pins.K[1]]]); ground(1070, d.pins.K[1]);
};
text(930, 612, 'Source impedance bank (select exactly one):', { size: 10, anchor: 'end', bold: true, color: C.dim });
pmos(625, 'PhotoMOS\nPR5', 'S', 'R 100 Ω', 'OUT', '← EXP1.B4  TG_IMP0', C.drv);
pmos(735, 'PhotoMOS\nPR6', 'S', 'R 470 Ω', 'OUT', '← EXP1.B5  TG_IMP1', C.drv);
pmos(845, 'PhotoMOS\nPR7', 'S', 'R 2.2 kΩ', 'OUT', '← EXP1.B6  TG_IMP2', C.drv);
text(930, 944, 'Kill-input test (low-active or high-active, unknown):', { size: 10, anchor: 'end', bold: true, color: C.dim });
pmos(960, 'PhotoMOS\nPR8', 'SHUT', 'R 100 Ω', 'GND', '← EXP2.B0  KILL_GND', C.dig);
pmos(1060, 'PhotoMOS\nPR9', 'SHUT', 'R 1 kΩ', '12V_ARMED', '← EXP2.B1  KILL_HI', C.dig);

// ================================================================ notes
box(20, 1190, 1010, 125, { fill: '#f8fafc', stroke: '#94a3b8' });
text(32, 1210, 'Notes', { size: 12, bold: true });
text(32, 1228, '• Pulse width, rate and order come from the Pico (GP6 / GP7, PIO or PWM). Positive pulse: A on. Negative: B on. Biphasic: A then B. The edges take 20–40 µs\n' +
  '  (PC817 + 4.7 kΩ), plenty for pickup-like pulses of 0.2–10 ms.\n' +
  '• Amplitude: V_AMP+ 0 … 8 V (limited in firmware by the mux supply +9 V), V_AMP− 0 … −3.3 V. Set by the DACs, then read back on JM2. To check the real OUT level under load, hold a long pulse (100 ms)\n' +
  '  with the CDI disconnected, read V_OUT_M, and compare with the bus levels.\n' +
  '• Self-test before arming: the 3V3_P side works (isolator, ADS1115, DACs answer). After arming: check the rails, the buses and OUT before the CDI is connected.\n' +
  '• The unknown-CDI search steps V_AMP+ up from the lowest level until the CDI fires, then records the threshold.', { size: 9.5, color: '#334155' });
box(1080, 1190, 500, 125, { fill: '#ffedd5', stroke: '#ea580c' });
text(1092, 1210, '⚠ Fire the CDI only into a load', { size: 12, bold: true, color: '#9a3412' });
text(1092, 1228, 'Ignition coil and spark gap in a closed non-conductive box,\n30 cm from the Pico and laptop. Arm only after the wiring\nis done. This board carries no HV, the CDI makes it.\nSee docs/safety.md.', { size: 9.5, color: '#9a3412' });

s.finish('ch-tg-schematic.drawio.svg', 'CH-TG trigger simulator');
