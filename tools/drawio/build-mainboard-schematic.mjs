#!/usr/bin/env node
// Builds hardware/diagrams/mainboard-schematic.drawio.svg: the integration sheet of the whole PCB.
// Usage: node tools/drawio/build-mainboard-schematic.mjs [--force]
// Once the file exists the .drawio.svg is the source of truth: do not overwrite it without --force.
// Source of the pin data: docs/pin-budget.md (keep them in sync). Same-named nets are connected.
import { createSchematic, C } from './schematic-lib.mjs';

const W = 1720, H = 1130;
const s = createSchematic({ W, H, title: 'Mainboard integration sheet' });
const { wire, text, box, ground, rail, icBox } = s;

text(20, 28, 'Mainboard integration sheet · whole PCB (PROPOSED)', { size: 18, bold: true });
text(20, 48, 'Pico 2 W socket, the two I/O expanders and the ADS1115, with the block they feed. Blocks: CH-R2 (ch-r2-pcb.md), CH-PU (ch-pu-pickup.md), ARM stage (power-arm.md), CH-TG (ch-tg-trigger.md). Same-named nets are connected.', { size: 11, color: C.dim });

const nl = (x, y, label, color = C.ink, side = 'l') => {
  if (side === 'l') { wire([[x, y], [x - 16, y]], color); text(x - 20, y + 4, label, { size: 9, anchor: 'end', color }); }
  else { wire([[x, y], [x + 16, y]], color); text(x + 20, y + 4, label, { size: 9, color }); }
};
const gl = (p) => { wire([p, [p[0] - 14, p[1]]]); ground(p[0] - 14, p[1]); };
const glr = (p) => { wire([p, [p[0] + 14, p[1]]]); ground(p[0] + 14, p[1]); };

// ============================================================ Pico 2 W
const P = [
  [1, 'GP0', 'RLY_EN → ARM: relay optocoupler', C.dig], [2, 'GP1', 'spare → J8', C.dim], [3, 'GND'], [4, 'GP2', 'PU_POS ← CH-PU comparator A', C.dig],
  [5, 'GP3', 'PU_NEG ← CH-PU comparator B', C.dig], [6, 'GP4', 'SDA  I²C bus', C.dig], [7, 'GP5', 'SCL  I²C bus', C.dig], [8, 'GND'],
  [9, 'GP6', 'TG_PULSE_A → CH-TG opto A', C.dig], [10, 'GP7', 'TG_PULSE_B → CH-TG opto B', C.dig], [11, 'GP8', 'HV_CMP → J8', C.dim], [12, 'GP9', 'SP_IN → J8', C.dim],
  [13, 'GND'], [14, 'GP10', 'RIG_PWM → J8', C.dim], [15, 'GP11', 'RIG_TACH ← J8', C.dim], [16, 'GP12', 'DRV_OUT → J8', C.dim],
  [17, 'GP13', 'ARM_SENSE ← ARM sense opto', C.dig], [18, 'GND'], [19, 'GP14', 'R2_DRIVE_1K → CH-R2 R_REF1', C.drv], [20, 'GP15', 'R2_DRIVE_10K → CH-R2 R_REF2', C.drv],
  [21, 'GP16', 'spare → J8', C.dim], [22, 'GP17', 'PU_DAC_CS → CH-PU DAC', C.dig], [23, 'GND'], [24, 'GP18', 'SPI0_SCK → CH-PU DAC', C.dig],
  [25, 'GP19', 'SPI0_MOSI → CH-PU DAC', C.dig], [26, 'GP20', 'EXP_RESET → EXP1, EXP2', C.dig], [27, 'GP21', 'EXP_INT ← EXP INTA, J8', C.dim], [28, 'GND'],
  [29, 'GP22', 'PWR_EN → ARM: switch-1 optocoupler', C.dig], [30, 'RUN', 'reset button to GND', C.dim], [31, 'GP26', 'PU_SIG ← CH-PU buffer (ADC0)', C.sense], [32, 'GP27', 'PU_PKP ← peak hold + (DNP)', C.sense],
  [33, 'AGND', 'analog ground (star point)', C.gnd], [34, 'GP28', 'PU_PKN ← peak hold − (DNP)', C.sense], [35, 'ADC_VREF', 'not connected', C.dim], [36, '3V3', '3V3 logic supply → 3V3A filter', C.clamp],
  [37, '3V3_EN', 'not connected', C.dim], [38, 'GND'], [39, 'VSYS', 'from U_ISO diode (DNP) / J8', C.clamp], [40, 'VBUS', 'USB 5 V (Pico micro-USB)', C.clamp],
];
const lab = (r) => `${r[0]}  ${r[1]}`;
const pico = icBox(250, 90, 190, 'U1  Raspberry Pi Pico 2 W  (socket, 2 × 1×20)', P.slice(0, 20).map(lab), P.slice(20).map(lab), { pitch: 26 });
P.slice(0, 20).forEach((r) => { const p = pico.pins[lab(r)]; if (r[1] === 'GND') gl(p); else nl(p[0], p[1], r[2], r[3], 'l'); });
P.slice(20).forEach((r) => { const p = pico.pins[lab(r)]; if (r[1] === 'GND') glr(p); else nl(p[0], p[1], r[2], r[3], 'r'); });

// ============================================================ expanders
const LD = '(PD)', PUL = '(PU)', HZ = '(hi-Z)';
const exp = (x, y, title, a0, rowsA, rowsB, extra) => {
  const left = ['1  GPB0', '2  GPB1', '3  GPB2', '4  GPB3', '5  GPB4', '6  GPB5', '7  GPB6', '8  GPB7', '9  VDD', '10  VSS', '11  NC', '12  SCL', '13  SDA', '14  NC'];
  const right = ['28  GPA7', '27  GPA6', '26  GPA5', '25  GPA4', '24  GPA3', '23  GPA2', '22  GPA1', '21  GPA0', '20  INTA', '19  INTB', '18  RESET', '17  A2', '16  A1', '15  A0'];
  const d = icBox(x, y, 190, title, left, right, { pitch: 26 });
  rowsB.forEach((r, i) => { if (r) nl(d.pins[left[i]][0], d.pins[left[i]][1], r, C.dig, 'l'); });
  rowsA.forEach((r, i) => { if (r) nl(d.pins[right[7 - i]][0] , d.pins[right[7 - i]][1], r, C.dig, 'r'); });
  nl(d.pins['9  VDD'][0], d.pins['9  VDD'][1], '3V3', C.clamp, 'l');
  gl(d.pins['10  VSS']);
  nl(d.pins['12  SCL'][0], d.pins['12  SCL'][1], 'SCL', C.dig, 'l'); nl(d.pins['13  SDA'][0], d.pins['13  SDA'][1], 'SDA', C.dig, 'l');
  nl(d.pins['20  INTA'][0], d.pins['20  INTA'][1], 'EXP_INT (optional)', C.dim, 'r');
  nl(d.pins['18  RESET'][0], d.pins['18  RESET'][1], 'EXP_RESET (GP20) + 10 kΩ pull-up', C.dig, 'r');
  glr(d.pins['17  A2']); glr(d.pins['16  A1']);
  if (a0 === 'gnd') glr(d.pins['15  A0']); else nl(d.pins['15  A0'][0], d.pins['15  A0'][1], '3V3  (address 0x21)', C.clamp, 'r');
  return d;
};
exp(1010, 90, 'U2  MCP23017  EXP1 (0x20)', 'gnd',
  [`PU_RANGE5 ${LD}`, `PU_RANGE20 ${LD}`, `PU_RANGE100 ${PUL}`, `PU_LOAD1 ${LD}`, `PU_LOAD2 ${LD}`, `PU_TEST ${HZ}`, `PU_PKRST_P ${HZ}`, `PU_PKRST_N ${HZ}`],
  ['spare', 'spare', 'spare', 'spare', `TG_IMP0 ${LD}`, `TG_IMP1 ${LD}`, `TG_IMP2 ${LD}`, `TG_EN ${LD}`]);
exp(1010, 560, 'U3  MCP23017  EXP2 (0x21)', '3v3',
  [`R4_EN ${LD}`, `INS_EN ${LD}`, 'HV_RANGE0 (later)', 'HV_RANGE1 (later)', `HV_PKRST ${HZ}`, 'MID_SENSE (input, 10 kΩ pull-up)', `R2_CAL1 ${LD}`, `R2_CAL2 ${LD}`],
  [`KILL_GND ${LD}`, `KILL_HI ${LD}`, 'spare', 'spare', 'spare', 'spare', 'spare', 'spare']);
text(1010, 1010, '(PD) = 10 kΩ pull-down, (PU) = 10 kΩ pull-up, (hi-Z) = no pull.\nThese are the safe states of every line when the expander is reset.\nFirmware pulses EXP_RESET first at boot, so the outputs return to\nthese defaults. Left column = port B (pins 1–8), right = port A.', { size: 9, color: C.dim });

// ============================================================ right column: boxes with text
const note = (x, y, w, h, fill, stroke, label, body, size = 9.5) => {
  box(x, y, w, h, { fill, stroke, dashed: true, label, size: 12 });
  text(x + 12, y + 44, body, { size, color: '#334155' });
};
note(1440, 80, 270, 175, '#f0fdf4', '#16a34a', 'ADS1115 and I²C bus',
  'U5 ADS1115 0x48: CH-R2 (node, tops).\nU6 ADS1115 0x4A: Phase 4 (DNP).\nJM1: ADS1115 breakout header (DNP),\nthe fallback for the 0.5 mm package.\nMain bus pull-ups 4.7 kΩ ×2 to 3V3.\nI²C isolator U14 (CH-TG) continues the\nbus to the 12 V power side.');
note(1440, 270, 270, 170, '#fefce8', '#ca8a04', 'Supplies on this sheet',
  '3V3 (Pico pin 36) → logic.\n3V3A = 3V3 through 10 Ω + 10 µF + 100 nF:\nCH-PU analog, ADS1115, DACs.\nVSYS (pin 39): USB, or U_ISO via 1N5819 (DNP).\n12V_RAW / 12V_ARMED / 3V3_P / ±5V_P:\npower domain, see power-arm.md and\nch-tg-trigger.md.\n100 nF at every IC supply pin.');
note(1440, 455, 270, 345, '#fff7ed', '#ea580c', 'Connectors (screw terminals 5.08 mm)',
  'J1   2-pos  12 V IN: +12 V, GND_P\nJ2A  4-pos  switch 1 chain: SW1A, SW2A\nJ2B  4-pos  switch 2 chain: SW1B, SW2B\nJ3   2-pos  OUT 1: 12V_ARMED (F2), GND_P\n            → CDI POWER +\nJ4   2-pos  OUT 2: spare / aux (F2), GND_P\nJ5   3-pos  CDI: TRIG+, SHUT DOWN, GND_P\nJ6   2-pos  CH-R2 DUT: DUT+, DUT−\nJ7   2-pos  CH-PU pickup: IN+, IN−\nJ8   2×8 header: expansion (3V3, GND_L,\n            SDA, SCL, GP1, GP8–GP12, GP16,\n            GP21, VSYS)\nJP1  1×3  mux VDD (12V_ARMED / U12)\nJC1, JC2  1×3 sockets: plug-in clamp\n            modules (CH-R2, CH-PU)\nSW_RST  push button RUN → GND');
note(1440, 815, 270, 250, '#eff6ff', '#2563eb', 'Layout partition (for KiCad)',
  'Left: logic domain (GND_L): Pico, expanders,\nADS1115, CH-R2, CH-PU.\nRight: 12 V power domain (GND_P): J1–J5, ARM\nstage, CH-TG.\nBetween: isolation slot ≥ 2 mm, no copper\ncrossing; only the optocouplers, photoMOS and\nthe ADuM1250 bridge it.\nAGND star point at the Pico AGND pin (33);\nDUT− and the CH-PU clamp return go there.\nTest points: see mainboard.md.');
box(20, 1080, 1400, 40, { fill: '#ffedd5', stroke: '#ea580c' });
text(32, 1104, '⚠ Low-voltage logic side only. The CDI makes 200–400 V and the ignition coil makes kV outside this board. Never connect J6 / J7 to a CDI output, a spinning pickup (J6) or an ignition coil. See docs/safety.md.', { size: 10.5, bold: true, color: '#9a3412' });

s.finish('mainboard-schematic.drawio.svg', 'Mainboard integration sheet');
