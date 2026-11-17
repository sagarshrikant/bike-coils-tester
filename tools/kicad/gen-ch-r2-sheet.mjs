#!/usr/bin/env node
// Generates hardware/kicad/mainboard/mainboard-ch-r2.kicad_sch: CH-R2 (2-wire resistance meter, ADS1115 version),
// hardware/circuits/ch-r2-pcb.md, as a netlist-style sheet (real KiCad symbols, every pin labelled).
// Usage: KICAD_SYMBOLS=<kicad-symbols checkout> node tools/kicad/gen-ch-r2-sheet.mjs [--nets]
import { Sheet } from './sch-lib.mjs';

const s = new Sheet('CH-R2');
const R = 'Device:R', C = 'Device:C', CP = 'Device:C_Polarized';
const R0805 = 'Resistor_SMD:R_0805_2012Metric', C0805 = 'Capacitor_SMD:C_0805_2012Metric';
const GL = 'GND_L', AG = 'AGND';

s.note(10, 8, 'CH-R2: 2-wire resistance meter, sensed by the ADS1115 module JM1 (generated)', 2.54);
s.note(10, 16, 'Source: hardware/circuits/ch-r2-pcb.md. R_dut = R_REF * V_node / (V_top - V_node). Every pin carries its net as a global label; the ADS1115 header JM1 is on the I/O sheet (labels V_NODE, V_TOP1K, V_TOP10K).');
s.note(10, 21, 'References are in the 200 series. Mapping: R201 R_REF1, R202 R_REF2, R205 R_S, R207 R_CAL1, R209 R_CAL2, PR3/PR4 self-test photoMOS, D201 = D7 (TVS), JC1 = clamp header.');

// ---- the two ranges
s.box(8, 28, 190, 70);
s.note(10, 29, 'Reference resistors: one drive pin high at a time, the other is an input');
s.two(R, 'R201', '1k 0.1% (R_REF1)', R0805, 40, 45, 'R2_DRIVE_1K', 'R2_NODE');
s.two(R, 'R202', '10k 0.1% (R_REF2)', R0805, 40, 70, 'R2_DRIVE_10K', 'R2_NODE');
s.two(R, 'R203', '1k (top filter, 1k range)', R0805, 100, 45, 'R2_DRIVE_1K', 'V_TOP1K');
s.two(C, 'C201', '100n', C0805, 150, 45, 'V_TOP1K', AG);
s.two(R, 'R204', '1k (top filter, 10k range)', R0805, 100, 70, 'R2_DRIVE_10K', 'V_TOP10K');
s.two(C, 'C202', '100n', C0805, 150, 70, 'V_TOP10K', AG);

// ---- node sense, clamp header, protection, terminals
s.box(8, 102, 190, 74);
s.note(10, 103, 'Node sense, plug-in clamp (BAT54S on JC1), TVS, DUT terminals');
s.two(R, 'R205', '1k (R_S)', R0805, 40, 120, 'R2_NODE', 'V_NODE');
s.two(C, 'C203', '100n', C0805, 85, 120, 'V_NODE', AG);
s.place({ libId: 'Connector:Conn_01x03_Socket', ref: 'JC1', value: 'clamp module: 1 3V3A, 2 NODE, 3 AGND', footprint: 'Connector_PinSocket_2.54mm:PinSocket_1x03_P2.54mm_Vertical', x: 135, y: 120, nets: { 1: '3V3A', 2: 'V_NODE', 3: AG } });
s.place({ libId: 'Device:D_TVS', ref: 'D201', value: 'SMAJ5.0CA (D7, bidirectional)', footprint: 'Diode_SMD:D_SMA', x: 40, y: 150, nets: { 1: 'R2_NODE', 2: AG } });
s.place({ libId: 'Connector:Screw_Terminal_01x02', ref: 'J6', value: 'DUT+ (red clip), DUT- (black clip)', footprint: 'TerminalBlock_Phoenix:TerminalBlock_Phoenix_MKDS-1,5-2-5.08_1x02_P5.08mm_Horizontal', x: 135, y: 155, nets: { 1: 'R2_NODE', 2: AG } });

// ---- self-test photoMOS across the DUT terminals
s.box(202, 28, 150, 100);
s.note(204, 29, 'Self-test (clips open): PR3 + 470 ohm checks the 1k range, PR4 + 47 kohm checks the 10k range');
const pr = (n, y, ctrl, rcal, rv, rl) => {
  s.place({ libId: 'Relay_SolidState:AQY282EH', ref: `PR${n}`, value: 'AQY212EH', footprint: 'Package_DIP:DIP-4_W7.62mm', x: 245, y, nets: { 1: `PR${n}_A`, 2: GL, 3: 'R2_NODE', 4: `PR${n}_B` } });
  s.two(R, `R${rl}`, '330 (LED)', R0805, 205 + 10, y + 14, ctrl, `PR${n}_A`);
  s.two(R, `R${rcal}`, rv, R0805, 300, y, `PR${n}_B`, AG);
};
pr(3, 55, 'R2_CAL1', 207, '470 0.1% (R_CAL1)', 206);
pr(4, 95, 'R2_CAL2', 209, '47k 0.1% (R_CAL2)', 208);

// ---- 3V3A analog supply and the AGND tie
s.box(202, 132, 150, 44);
s.note(204, 133, '3V3A filter and the single AGND-to-GND_L tie (analog star point)');
s.two(R, 'R210', '10 (3V3 to 3V3A)', R0805, 225, 150, '3V3', '3V3A');
s.two(CP, 'C204', '10u 16V', 'Capacitor_SMD:C_1206_3216Metric', 275, 150, '3V3A', AG);
s.two(C, 'C205', '100n', C0805, 320, 150, '3V3A', AG);
s.place({ libId: 'Device:NetTie_2', ref: 'NT1', value: 'AGND - GND_L', footprint: 'NetTie:NetTie-2_SMD_Pad0.5mm', x: 225, y: 168, nets: { 1: AG, 2: GL } });

s.note(10, 185, 'Not protected against a live source: never connect J6 to a spinning pickup, a CDI output or an ignition coil. Use CH-PU for pickups. See docs/safety.md.');
s.note(10, 190, 'Pin order of the AQY212EH on the PCB: 1 LED anode, 2 LED cathode, 3 and 4 the switch (the KiCad symbol AQY282EH has the same DIP-4 layout).');

const size = s.write('hardware/kicad/mainboard/mainboard-ch-r2.kicad_sch', 'A3');
console.log(`wrote hardware/kicad/mainboard/mainboard-ch-r2.kicad_sch (${size} bytes)`);
if (process.argv.includes('--nets')) for (const [n, p] of [...s.netlist].sort()) console.log(n.padEnd(14), p.join('  '));
for (const w of s.warn) console.warn('WARN', w);
