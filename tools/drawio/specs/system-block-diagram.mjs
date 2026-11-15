// Initial spec for hardware/diagrams/system-block-diagram.drawio.svg.
// After the first build, edit the .drawio.svg in draw.io instead of this file.
const ph1 = { fill: '#dcfce7', stroke: '#16a34a' };      // current phase
const later = { fill: '#ffffff', stroke: '#64748b' };
const hv = { fill: '#fff7ed', stroke: '#ea580c' };
const C = { sig: '#2563eb', hv: '#dc2626', drv: '#ea580c', meas: '#16a34a', net: '#7c3aed', pwr: '#475569' };

const afe = [
  ['r2', 'CH-R2  2-wire resistance\n1k / 10k ratiometric  · Phase 1', ph1],
  ['r4', 'CH-R4  4-wire low-ohm\n100 mA CC + ADS1115  · Ph 4', later],
  ['ins', 'CH-INS  insulation / leakage 50 V  · Ph 4', later],
  ['pu', 'CH-PU  pickup input ±100 V\ndivider + comparator  · Ph 2', later],
  ['tg', 'CH-TG  trigger generator\n(simulated pickup)  · Ph 3', later],
  ['hvd', 'CH-HV  100:1 HV divider\npeak detect + comparator  · Ph 3', hv],
  ['cur', 'CH-I  current shunt amplifier  · Ph 3-5', later],
  ['sp', 'CH-SP  spark detector\nHT-lead inductive loop  · Ph 5', later],
  ['drv', 'DRV  IGBT coil driver\nopto-isolated  · Ph 5', hv],
  ['mux', 'Analog mux CD4051 / ext. ADC  · Ph 2', later],
].map(([id, label, st], i) => ({ id, label, x: 340, y: 90 + i * 64, w: 290, h: 50, ...st }));

export default {
  title: 'Bike Coils Tester - System Block Diagram',
  width: 1390, height: 780,
  groups: [
    { id: 'g_uut', label: 'Units under test', x: 20, y: 50, w: 250, h: 560, fill: '#fefce8', stroke: '#ca8a04' },
    { id: 'g_afe', label: 'Analog front-end modules (perfboard → PCB)', x: 320, y: 50, w: 330, h: 700 },
    { id: 'g_pico', label: 'Controller', x: 700, y: 200, w: 260, h: 330, fill: '#eff6ff', stroke: '#2563eb' },
    { id: 'g_app', label: 'Flutter app', x: 1020, y: 200, w: 350, h: 330, fill: '#f5f3ff', stroke: '#7c3aed' },
    { id: 'g_pwr', label: 'Power & isolation', x: 700, y: 590, w: 670, h: 160 },
  ],
  nodes: [
    { id: 'title', label: 'Bike Coils Tester — System Block Diagram', x: 20, y: 8, w: 1350, h: 32,
      fill: '#ffffff', stroke: '#ffffff', bold: true, fontSize: 18 },
    { id: 'rig', label: 'Motor rig\nreluctor disc + optical RPM', x: 40, y: 85, w: 210, h: 56 },
    { id: 'pickup', label: 'Pickup / pulser coil', x: 40, y: 185, w: 210, h: 56, ...ph1 },
    { id: 'cdi', label: 'CDI unit\nAC-CDI / DC-CDI', x: 40, y: 285, w: 210, h: 56, ...hv },
    { id: 'coil', label: 'Ignition coil\nprimary / secondary', x: 40, y: 385, w: 210, h: 56, ...hv },
    { id: 'gap', label: 'Spark gap\n(enclosed, adjustable)', x: 40, y: 485, w: 210, h: 56, ...hv },
    ...afe,
    { id: 'pico', label: 'Raspberry Pi Pico W\nRP2040 · MicroPython', x: 720, y: 235, w: 220, h: 56, bold: true,
      fill: '#dbeafe', stroke: '#2563eb' },
    { id: 'adc', label: 'ADC 12-bit × 3 (GP26-28)', x: 720, y: 305, w: 220, h: 36 },
    { id: 'pio', label: 'PIO: edge timing 8 ns / pulse gen', x: 720, y: 351, w: 220, h: 36 },
    { id: 'gpio', label: 'GPIO: ranges · enables · arm', x: 720, y: 397, w: 220, h: 36 },
    { id: 'cyw', label: 'CYW43439\nWi-Fi (AP / STA) + BLE', x: 720, y: 450, w: 220, h: 56, ...ph1 },
    { id: 'app', label: 'coil_tester\nAndroid · iOS · Web', x: 1040, y: 235, w: 310, h: 56, bold: true,
      fill: '#ede9fe', stroke: '#7c3aed' },
    { id: 'live', label: 'Live values & waveforms', x: 1040, y: 305, w: 310, h: 40 },
    { id: 'tests', label: 'Guided tests · PASS / FAIL vs spec presets', x: 1040, y: 355, w: 310, h: 40 },
    { id: 'chain', label: 'Chain test · fault localisation', x: 1040, y: 405, w: 310, h: 40 },
    { id: 'rep', label: 'Reports & history (PDF / share)', x: 1040, y: 455, w: 310, h: 40 },
    { id: 'batt', label: '12 V bench supply / battery\ncurrent-limited, 5 A fuse', x: 720, y: 640, w: 210, h: 60 },
    { id: 'buck', label: 'Buck → 5 V\nMP1584 / LM2596', x: 960, y: 640, w: 170, h: 60 },
    { id: 'iso', label: 'HV stages isolated:\nonly dividers + optos\ncross to the Pico side', x: 1160, y: 632, w: 190, h: 76, ...hv },
  ],
  edges: [
    { from: 'rig', fromSide: 'bottom', to: 'pickup', toSide: 'top', label: 'reluctor', color: C.pwr },
    { from: 'pickup', fromSide: 'bottom', to: 'cdi', toSide: 'top', label: 'trigger pulse', color: C.sig },
    { from: 'cdi', fromSide: 'bottom', to: 'coil', toSide: 'top', label: '200-400 V pulse', color: C.hv },
    { from: 'coil', fromSide: 'bottom', to: 'gap', toSide: 'top', label: '20-40 kV', color: C.hv },

    { from: 'pickup', fromSide: 'right', fromPos: 0.3, to: 'r2', toSide: 'left', viaX: 285, color: C.meas, dashed: true },
    { from: 'pickup', fromSide: 'right', fromPos: 0.7, to: 'pu', toSide: 'left', viaX: 300, color: C.sig },
    { from: 'tg', fromSide: 'left', to: 'cdi', toSide: 'right', toPos: 0.3, viaX: 290, color: C.drv },
    { from: 'cdi', fromSide: 'right', fromPos: 0.7, to: 'hvd', toSide: 'left', viaX: 305, color: C.hv },
    { from: 'coil', fromSide: 'right', fromPos: 0.3, to: 'r4', toSide: 'left', viaX: 280, color: C.meas, dashed: true },
    { from: 'drv', fromSide: 'left', to: 'coil', toSide: 'right', toPos: 0.7, viaX: 295, color: C.drv },
    { from: 'gap', fromSide: 'right', to: 'sp', toSide: 'left', viaX: 310, color: C.sig },

    { from: 'g_afe', fromSide: 'right', fromPos: 0.5, to: 'g_pico', toSide: 'left', toPos: 0.606,
      label: 'signals / control\nheader bus', color: C.sig, both: true },
    { from: 'cyw', fromSide: 'right', to: 'g_app', toSide: 'left', toPos: (478 - 200) / 330,
      label: 'Wi-Fi HTTP JSON\n(BLE later)', color: C.net, both: true },
    { from: 'batt', fromSide: 'right', to: 'buck', toSide: 'left', color: C.pwr },
    { from: 'buck', fromSide: 'top', to: 'g_pico', toSide: 'bottom', toPos: 0.9, label: '5 V → VSYS', color: C.pwr },
  ],
};
