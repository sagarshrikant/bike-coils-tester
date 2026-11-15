// Initial spec for hardware/diagrams/ch-r2-resistance.drawio.svg (Phase 1 wiring).
// After the first build, edit the .drawio.svg in draw.io instead of this file.
const pin = { fill: '#dbeafe', stroke: '#2563eb' };
const res = { fill: '#ffffff', stroke: '#111827' };
const prot = { fill: '#fef9c3', stroke: '#ca8a04' };
const W = { drv: '#dc2626', sense: '#2563eb', gnd: '#111827' };

export default {
  title: 'CH-R2 - 2-wire resistance meter (Phase 1)',
  width: 1000, height: 560,
  groups: [
    { id: 'g_pico', label: 'Raspberry Pi Pico W', x: 30, y: 60, w: 230, h: 440, fill: '#eff6ff', stroke: '#2563eb' },
    { id: 'g_dut', label: 'Device under test', x: 760, y: 140, w: 210, h: 260, fill: '#fefce8', stroke: '#ca8a04' },
  ],
  nodes: [
    { id: 'title', label: 'CH-R2 — 2-wire resistance meter (Phase 1)', x: 30, y: 10, w: 940, h: 32,
      fill: '#ffffff', stroke: '#ffffff', bold: true, fontSize: 18 },
    { id: 'gp14', label: 'GP14  drive 1k (pin 19)', x: 50, y: 95, w: 190, h: 34, ...pin },
    { id: 'gp27', label: 'GP27 / ADC1  top 1k (pin 32)', x: 50, y: 140, w: 190, h: 34, ...pin },
    { id: 'gp15', label: 'GP15  drive 10k (pin 20)', x: 50, y: 205, w: 190, h: 34, ...pin },
    { id: 'gp28', label: 'GP28 / ADC2  top 10k (pin 34)', x: 50, y: 250, w: 190, h: 34, ...pin },
    { id: 'gp26', label: 'GP26 / ADC0  node (pin 31)', x: 50, y: 330, w: 190, h: 34, ...pin },
    { id: 'agnd', label: 'AGND (pin 33)', x: 50, y: 440, w: 190, h: 34, ...pin },

    { id: 'rref1', label: 'R_REF1  1 kΩ 0.1 %', x: 360, y: 108, w: 150, h: 40, ...res },
    { id: 'rref2', label: 'R_REF2  10 kΩ 0.1 %', x: 360, y: 218, w: 150, h: 40, ...res },
    { id: 'rs', label: 'R_S  1 kΩ', x: 360, y: 327, w: 150, h: 40, ...res },
    { id: 'clamp', label: 'BAT54S clamp to 3V3/GND\n+ C1 100 nF to AGND', x: 300, y: 395, w: 210, h: 44, ...prot },
    { id: 'node', label: 'DUT+ node', x: 600, y: 200, w: 100, h: 60, bold: true },

    { id: 'dut', label: 'Coil under test\npickup · exciter ·\nHT secondary', x: 785, y: 210, w: 160, h: 80, bold: true },
    { id: 'red', label: 'red clip', x: 785, y: 175, w: 160, h: 26, fill: '#fee2e2', stroke: '#dc2626' },
    { id: 'blk', label: 'black clip', x: 785, y: 300, w: 160, h: 26, fill: '#e5e7eb', stroke: '#111827' },

    { id: 'note', label: 'GP14 / GP15: output HIGH = range on, INPUT (high-Z) = off.\n' +
      'Only one range is active at a time. Turn-off: drive LOW 20 ms, then INPUT.\n' +
      'R_dut = R_REF · V_node / (V_top − V_node)    100 nF on GP27, GP28 to AGND.',
      x: 300, y: 470, w: 670, h: 62, fill: '#f8fafc', stroke: '#94a3b8' },
  ],
  edges: [
    { from: 'gp14', fromSide: 'right', to: 'rref1', toSide: 'left', toPos: 0.3, color: W.drv, arrow: false },
    { from: 'gp27', fromSide: 'right', to: 'rref1', toSide: 'left', toPos: 0.7, label: 'top sense', color: W.sense, arrow: false },
    { from: 'gp15', fromSide: 'right', to: 'rref2', toSide: 'left', toPos: 0.3, color: W.drv, arrow: false },
    { from: 'gp28', fromSide: 'right', to: 'rref2', toSide: 'left', toPos: 0.7, label: 'top sense', color: W.sense, arrow: false },
    { from: 'rref1', fromSide: 'right', to: 'node', toSide: 'left', toPos: 0.3, color: W.drv, arrow: false },
    { from: 'rref2', fromSide: 'right', to: 'node', toSide: 'left', toPos: 0.7, color: W.drv, arrow: false },
    { from: 'gp26', fromSide: 'right', to: 'rs', toSide: 'left', color: W.sense, arrow: false },
    { from: 'rs', fromSide: 'right', to: 'node', toSide: 'bottom', color: W.sense, arrow: false },
    { from: 'gp26', fromSide: 'right', fromPos: 0.8, to: 'clamp', toSide: 'left', viaX: 280, color: '#ca8a04', arrow: false },
    { from: 'node', fromSide: 'right', to: 'red', toSide: 'left', color: W.drv, arrow: false },
    { from: 'agnd', fromSide: 'right', to: 'blk', toSide: 'left', viaX: 740, label: 'DUT− / ground', color: W.gnd, arrow: false },
  ],
};
