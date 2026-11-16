#!/usr/bin/env node
// Builds hardware/diagrams/power-arm-schematic.drawio.svg (12 V input and ARM stage with series relay).
// Usage: node tools/drawio/build-power-arm-schematic.mjs [--force]
// Once the file exists the .drawio.svg is the source of truth: do not overwrite it without --force.
import { createSchematic, C } from './schematic-lib.mjs';

const W = 1500, H = 1140;
const s = createSchematic({ W, H, title: 'Power input and ARM stage' });
const { wire, dot, text, box, resistorH, resistorV, capacitor, diodeUp, diodeDown, tvs, ground, terminal, switchV, fuseV, pmos, nmos, coilV, icBox } = s;
const GREEN = '#16a34a', RED = '#dc2626';
const SW = '#b45309';

text(20, 28, 'Power input and ARM stage with series relay · schematic (PROPOSED)', { size: 18, bold: true });
text(20, 48, 'Two independent switches in series (Q2 and relay K1), each with its own firmware enable, its own optocoupler and its own pole of the ARM switch. The 12 V outputs are live only when both close.', { size: 11, color: C.dim });

box(20, 70, 880, 930, { fill: '#fff7ed', stroke: '#ea580c', dashed: true, label: '12 V POWER DOMAIN (ground = GND_P)', size: 12 });
box(1020, 70, 460, 930, { fill: '#eff6ff', stroke: '#2563eb', dashed: true, label: 'LOGIC DOMAIN (Pico 2 W, ground = GND_L)', size: 12 });
text(960, 98, 'isolation\nbarrier', { size: 9, anchor: 'middle', color: C.dim, bold: true });

// ---- 12 V in, fuse, reverse-polarity protection
terminal(200, 100, C.drv); text(216, 104, 'J1+  12 V IN  (bench supply or battery, 16 V max)', { size: 11, bold: true, color: C.drv });
wire([[200, 106], [200, 130]], C.drv);
fuseV(200, 130); text(216, 154, 'F1  5 A', { size: 10, bold: true });
wire([[200, 170], [200, 190]], C.drv);
terminal(60, 150, C.gnd); text(74, 154, 'J1−  GND_P', { size: 11, bold: true });
wire([[60, 156], [60, 168]], C.gnd); ground(60, 168);
const q1 = pmos(162, 190);
text(216, 218, 'Q1  IRF4905\nreverse-polarity\nprotection', { size: 9, color: C.dim });
wire([q1.g, [90, q1.g[1]]]); dot(90, q1.g[1]);
resistorV(90, 220); ground(90, 304); text(80, 262, 'R_G1 10 kΩ', { size: 9, anchor: 'end', color: C.dim });
wire([q1.s, [200, 300]], C.drv); dot(200, 300, C.drv);
text(212, 292, '12V_RAW', { size: 11, bold: true, color: C.drv });
wire([[130, 300], [870, 300]], C.drv); dot(130, 300, C.drv);

// ---- 12V_RAW branches
dot(260, 300, C.drv); tvs(260, 300); ground(260, 364);
text(272, 368, 'D1  SMBJ18A (TVS)', { size: 9, color: C.clamp, bold: true });
dot(330, 300, C.drv); capacitor(330, 300); ground(330, 332);
text(346, 320, 'C1  470 µF\n+ 100 nF', { size: 9, color: C.dim });
dot(410, 300, C.drv); resistorV(410, 300); diodeDown(410, 380, GREEN); ground(410, 410);
text(426, 340, 'R 2.2 kΩ', { size: 9, color: C.dim });
text(426, 400, '12 V present (green LED)', { size: 9, color: GREEN, bold: true });

// ---- optional isolated supply for the logic domain
dot(520, 300, C.drv);
const iso = icBox(560, 120, 150, 'U_ISO  B1205S-1W\n(DNP, optional)', ['+VIN', '−VIN'], ['+VOUT 5 V', '−VOUT'], { pitch: 26 });
wire([[520, 300], [520, iso.pins['+VIN'][1]], iso.pins['+VIN']], C.drv);
wire([iso.pins['−VIN'], [530, iso.pins['−VIN'][1]]]); ground(530, iso.pins['−VIN'][1]);
wire([iso.pins['+VOUT 5 V'], [1060, iso.pins['+VOUT 5 V'][1]]], C.dig);
text(1066, iso.pins['+VOUT 5 V'][1] + 4, '5 V isolated → 1N5819 → Pico VSYS (pin 39)', { size: 10, color: C.dig, bold: true });
text(1066, iso.pins['+VOUT 5 V'][1] + 18, 'DNP: use when the Pico runs from the 12 V supply instead of USB', { size: 9, color: C.dim });
wire([iso.pins['−VOUT'], [1060, iso.pins['−VOUT'][1]]]); ground(1060, iso.pins['−VOUT'][1]);
text(1070, iso.pins['−VOUT'][1] + 18, 'GND_L', { size: 9, color: C.dim, bold: true });

// ---- switch 1: Q2 (source on the input side, so its body diode blocks when it is off)
wire([[200, 300], [200, 430]], C.drv);
const q2 = pmos(162, 430, { flip: true });
text(216, 454, 'Q2  IRF4905\nswitch 1', { size: 9, color: C.dim });
resistorV(130, 300); text(116, 345, 'R_PU\n10 kΩ', { size: 9, anchor: 'end', color: C.dim });
wire([[130, 380], [130, 460]]); wire([q2.g, [130, q2.g[1]]]); dot(130, 460);
wire([[130, 460], [130, 490]]); resistorV(130, 490); text(116, 530, 'R_PD\n2.2 kΩ', { size: 9, anchor: 'end', color: C.dim });
wire([[130, 570], [130, 580]]); switchV(130, 580, '', SW);
text(116, 600, 'SW1A  ARM\n(DPST, panel)', { size: 9, anchor: 'end', bold: true, color: SW });
wire([[130, 620], [130, 640]]); switchV(130, 640, '', SW);
text(116, 660, 'SW2A  E-STOP\n(NC / jumper)', { size: 9, anchor: 'end', bold: true, color: SW });
wire([[130, 680], [130, 864], [914, 864]], C.dig);

// ---- 12V_MID, relay contact K1, 12V_ARMED
wire([q2.d, [200, 520]], C.drv); dot(200, 520, C.drv);
text(212, 512, '12V_MID', { size: 11, bold: true, color: C.drv });
wire([[200, 520], [400, 520]], C.drv);
dot(400, 520, C.drv); resistorV(400, 520); text(416, 565, 'R_SM 3.3 kΩ', { size: 9, color: C.dim });
wire([[400, 600], [400, 610], [914, 610]], C.dig);
wire([[200, 520], [200, 545]], C.drv); switchV(200, 545, '', C.drv);
text(216, 566, 'K1  relay contact\nSPST-NO, ≥ 10 A', { size: 9, bold: true, color: C.drv });
wire([[200, 585], [200, 660]], C.drv); dot(200, 660, C.drv);
text(212, 652, '12V_ARMED', { size: 11, bold: true, color: C.drv });
wire([[200, 660], [740, 660]], C.drv);
dot(280, 660, C.drv); resistorV(280, 660); ground(280, 742);
text(268, 706, 'R_BL 4.7 kΩ\n0.5 W (bleeds\nthe rail)', { size: 9, anchor: 'end', color: C.dim });
dot(350, 660, C.drv); resistorV(350, 660); diodeDown(350, 740, RED); ground(350, 770);
text(366, 700, 'R 2.2 kΩ', { size: 9, color: C.dim });
text(366, 764, 'ARMED (red LED)', { size: 9, color: RED, bold: true });
dot(430, 660, C.drv); resistorV(430, 660); text(446, 700, 'R_S 3.3 kΩ', { size: 9, color: C.dim });
wire([[430, 740], [430, 754], [914, 754]], C.dig);
for (const [x, label] of [[520, 'J3  OUT 1: CDI +12 V'], [700, 'J4  OUT 2 (spare)']]) {
  dot(x, 660, C.drv); fuseV(x, 660); wire([[x, 700], [x, 714]], C.drv); terminal(x, 720, C.drv);
  text(x + 12, 686, 'F2  2 A', { size: 9, color: C.dim });
  text(x + 12, 724, label, { size: 10, bold: true, color: C.drv });
}
text(520, 790, 'Load returns go to J1− / GND_P (heavy trace).\nThe ignition-coil primary pulse current returns\nthere too: keep it away from the logic ground.', { size: 9, color: C.dim });

// ---- relay driver: switch 2 (own enable, own optocoupler, own switch poles)
dot(680, 300, C.drv);
switchV(680, 310, '', SW); wire([[680, 300], [680, 310]], C.drv);
text(696, 332, 'SW1B', { size: 9, bold: true, color: SW });
wire([[680, 350], [680, 364]]); switchV(680, 364, '', SW);
text(696, 386, 'SW2B', { size: 9, bold: true, color: SW });
wire([[680, 404], [680, 416]]);
coilV(680, 416); text(664, 452, 'K1 coil\n12 V, 30–60 mA', { size: 9, anchor: 'end', bold: true, color: C.dim });
wire([[680, 496], [680, 510]]); dot(680, 496);
wire([[680, 416], [740, 416], [740, 426]], C.drv); diodeUp(740, 426); wire([[740, 456], [740, 496], [680, 496]], C.drv);
text(752, 446, 'D6 1N4007\n(flyback)', { size: 9, color: C.clamp, bold: true });
const q3 = nmos(678, 510, { mirror: true });
text(640, 544, 'Q3\n2N7000', { size: 9, anchor: 'end', color: C.dim });
wire([q3.s, [680, 574]]); ground(680, 574);
wire([q3.g, [760, q3.g[1]]]); dot(760, q3.g[1]);
resistorV(760, 540); ground(760, 622); text(776, 580, 'R_GQ 10 kΩ', { size: 9, color: C.dim });
wire([[760, 540], [790, 540], [790, 510], [914, 510]], C.dig);
wire([[870, 300], [870, 484], [914, 484]], C.drv); dot(870, 300, C.drv);

// ---- optocouplers across the barrier
const uRly = icBox(930, 440, 80, 'PC817\nRELAY', ['C', 'E'], ['A', 'K'], { pitch: 26 });
wire([uRly.pins.A, [1050, uRly.pins.A[1]]], C.dig);
resistorH(1050, 484, C.dig); text(1090, 468, 'R 330 Ω', { size: 9, anchor: 'middle', color: C.dim });
wire([[1130, 484], [1170, 484]], C.dig); dot(1150, 484, C.dig);
resistorV(1150, 484, C.dig); ground(1150, 564);
text(1166, 530, 'R 10 kΩ pull-down', { size: 9, color: C.dim });
text(1176, 488, 'RLY_EN ← GP0', { size: 10, bold: true, color: C.dig });
wire([uRly.pins.K, [1050, uRly.pins.K[1]]]); ground(1050, uRly.pins.K[1]);

const uMid = icBox(930, 566, 80, 'PC817\nMID sense', ['A', 'K'], ['C', 'E'], { pitch: 26 });
wire([uMid.pins.K, [890, uMid.pins.K[1]]]); ground(890, uMid.pins.K[1]);
wire([uMid.pins.C, [1090, uMid.pins.C[1]]], C.dig);
text(1096, uMid.pins.C[1] + 4, 'MID_SENSE → EXP2.A5  (low = Q2 side live)', { size: 10, bold: true, color: C.dig });
wire([uMid.pins.E, [1050, uMid.pins.E[1]]]); ground(1050, uMid.pins.E[1]);

const uSense = icBox(930, 710, 80, 'PC817\nARMED sense', ['A', 'K'], ['C', 'E'], { pitch: 26 });
wire([uSense.pins.K, [890, uSense.pins.K[1]]]); ground(890, uSense.pins.K[1]);
wire([uSense.pins.C, [1090, uSense.pins.C[1]]], C.dig);
text(1096, uSense.pins.C[1] + 4, 'ARM_SENSE → GP13  (low = rail is live)', { size: 10, bold: true, color: C.dig });
wire([uSense.pins.E, [1050, uSense.pins.E[1]]]); ground(1050, uSense.pins.E[1]);

const uArm = icBox(930, 820, 80, 'PC817\nSWITCH 1', ['C', 'E'], ['A', 'K'], { pitch: 26 });
wire([uArm.pins.E, [890, uArm.pins.E[1]]]); ground(890, uArm.pins.E[1]);
wire([uArm.pins.A, [1050, uArm.pins.A[1]]], C.dig);
resistorH(1050, 864, C.dig); text(1090, 848, 'R 330 Ω', { size: 9, anchor: 'middle', color: C.dim });
wire([[1130, 864], [1170, 864]], C.dig); dot(1150, 864, C.dig);
resistorV(1150, 864, C.dig); ground(1150, 944);
text(1166, 910, 'R 10 kΩ pull-down\n(off while the Pico\nis in reset)', { size: 9, color: C.dim });
text(1176, 868, 'PWR_EN ← GP22', { size: 10, bold: true, color: C.dig });
wire([uArm.pins.K, [1050, uArm.pins.K[1]]]); ground(1050, uArm.pins.K[1]);

text(1040, 110, 'Pico 2 W and everything on the measurement side share GND_L.\nThe coil under test (CH-R2, CH-PU) is on this side.\nPower: USB, or the optional isolated 5 V module (left, DNP).', { size: 10, color: '#334155' });
text(1040, 300, 'Firmware rules (D10, D14):\n• Both enables stay low until the self-test has passed.\n• Arm: close the relay first (RLY_EN), then Q2 (PWR_EN).\n  Disarm: Q2 first, then the relay. The relay never\n  switches load current.\n• While armed the Pico watchdog is on: a hang or reset\n  drops GP0 and GP22 (pull-downs) and both open.\n• MID_SENSE live while Q2 is off = Q2 shorted.\n  ARM_SENSE live while both are off = relay welded.\n  Either one: alarm, tell the user to switch off J1.', { size: 10, color: '#334155' });

// ---- notes
box(20, 1012, 880, 125, { fill: '#f8fafc', stroke: '#94a3b8' });
text(32, 1033, 'Notes', { size: 12, bold: true });
text(32, 1051, '• Switch 1 (Q2) is on only when PWR_EN, SW1A and SW2A all agree. Switch 2 (K1) is on only when RLY_EN, SW1B and SW2B all agree. Q2 gate:\n' +
  '  12 V × 2.2 / 12.2, Vgs ≈ −9.8 V. Q3 gate: about 11.7 V through the optocoupler.\n' +
  '• SW1 is a DPST toggle (two poles), SW2 an E-STOP with two normally-closed contacts (or a jumper per pole). One fault cannot defeat both paths.\n' +
  '• Q1 / Q2 are P-channel MOSFETs (IRF4905, −55 V, 20 mΩ), Q2 with its source on the input side. K1: 12 V coil, SPST-NO, 10 A contacts (check part).\n' +
  '• Limits: input 16 V max (D1 clamps spikes), F1 5 A (rule 6 in docs/safety.md), F2 2 A per output. Use the bench supply current limit as well.\n' +
  '• R_BL discharges the rail when disarmed. PC817 transistor Vce rating (35 V) is above the drive voltages (≤ 16 V).', { size: 9.5, color: '#334155' });
box(920, 1012, 560, 125, { fill: '#ffedd5', stroke: '#ea580c' });
text(932, 1033, '⚠ This board carries no high voltage', { size: 12, bold: true, color: '#9a3412' });
text(932, 1051, 'The 12 V rail only powers the CDI input and the trigger drivers.\nThe CDI makes the 200–400 V itself, and the ignition coil makes the kV.\nNever bypass SW1, SW2 or the relay. Fire the CDI only into a load\n(ignition coil + spark gap in a closed box). See docs/safety.md.', { size: 9.5, color: '#9a3412' });

s.finish('power-arm-schematic.drawio.svg', 'Power input and ARM stage');
