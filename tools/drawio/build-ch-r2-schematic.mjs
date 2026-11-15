#!/usr/bin/env node
// Builds hardware/diagrams/ch-r2-schematic.drawio.svg: a real schematic (component symbols) of CH-R2.
// Usage: node tools/drawio/build-ch-r2-schematic.mjs [--force]
// Like build.mjs it refuses to overwrite an existing file (the user may have edited it in draw.io).
//
// Every symbol is drawn as plain SVG in the picture AND embedded in the draw.io model as an
// image cell, so the file looks the same everywhere and stays editable (move/rename/rewire) in draw.io.
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const W = 1020, H = 740;
const C = { drv: '#dc2626', sense: '#2563eb', gnd: '#111827', clamp: '#ca8a04', ink: '#111827' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const svg = [];     // picture
const cells = [];   // draw.io model
let id = 2;
const nid = () => `c${id++}`;

// ---- primitives -----------------------------------------------------------------------------
function wire(pts, color = C.ink) {
  svg.push(`<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`);
  const [s, ...rest] = pts; const t = rest.pop(); const via = rest;
  cells.push(`<mxCell id="${nid()}" value="" style="endArrow=none;html=1;rounded=0;strokeWidth=2;strokeColor=${color};" edge="1" parent="1">` +
    `<mxGeometry relative="1" as="geometry"><mxPoint x="${s[0]}" y="${s[1]}" as="sourcePoint"/><mxPoint x="${t[0]}" y="${t[1]}" as="targetPoint"/>` +
    (via.length ? `<Array as="points">${via.map((p) => `<mxPoint x="${p[0]}" y="${p[1]}"/>`).join('')}</Array>` : '') +
    `</mxGeometry></mxCell>`);
}
function dot(x, y, color = C.ink) {
  svg.push(`<circle cx="${x}" cy="${y}" r="4" fill="${color}"/>`);
  cells.push(`<mxCell id="${nid()}" value="" style="ellipse;html=1;fillColor=${color};strokeColor=${color};" vertex="1" parent="1">` +
    `<mxGeometry x="${x - 4}" y="${y - 4}" width="8" height="8" as="geometry"/></mxCell>`);
}
function text(x, y, label, { size = 12, color = C.ink, bold = false, anchor = 'start' } = {}) {
  const lines = String(label).split('\n'); const lh = size * 1.3;
  const tsp = lines.map((l, i) => `<tspan x="${x}" y="${(y + i * lh).toFixed(1)}">${esc(l)}</tspan>`).join('');
  svg.push(`<text font-family="Helvetica, Arial, sans-serif" font-size="${size}" fill="${color}" text-anchor="${anchor}"${bold ? ' font-weight="bold"' : ''}>${tsp}</text>`);
  const w = Math.max(...lines.map((l) => l.length)) * size * 0.62 + 6, h = lines.length * lh + 4;
  const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
  cells.push(`<mxCell id="${nid()}" value="${esc(esc(label).replace(/\n/g, '<br>'))}" style="text;html=1;whiteSpace=wrap;align=${anchor === 'end' ? 'right' : anchor === 'middle' ? 'center' : 'left'};verticalAlign=top;fontSize=${size};fontColor=${color};${bold ? 'fontStyle=1;' : ''}" vertex="1" parent="1">` +
    `<mxGeometry x="${x0}" y="${y - size}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
}
function box(x, y, w, h, { fill, stroke, dashed = false, label = '' } = {}) {
  svg.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"${dashed ? ' stroke-dasharray="6 4"' : ''}/>`);
  if (label) label.split('\n').forEach((l, i) => svg.push(`<text font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="bold" fill="#334155" text-anchor="middle" x="${x + w / 2}" y="${y + 20 + i * 16}">${esc(l)}</text>`));
  cells.push(`<mxCell id="${nid()}" value="${esc(esc(label).replace(/\n/g, '<br>'))}" style="rounded=1;arcSize=3;html=1;whiteSpace=wrap;${dashed ? 'dashed=1;' : ''}fillColor=${fill};strokeColor=${stroke};verticalAlign=top;fontStyle=1;fontSize=13;fontColor=#334155;" vertex="1" parent="1">` +
    `<mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
}

// A symbol is drawn in local coords inside a bbox; placed in the picture with a <g transform> and as an image cell.
function symbol(x, y, w, h, body, stroke = C.ink) {
  const inner = `<g fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${body}</g>`;
  svg.push(`<g transform="translate(${x},${y})">${inner}</g>`);
  const standalone = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
  const b64 = Buffer.from(standalone).toString('base64');
  cells.push(`<mxCell id="${nid()}" value="" style="shape=image;html=1;verticalLabelPosition=bottom;aspect=fixed;imageAspect=0;image=data:image/svg+xml,${b64};" vertex="1" parent="1">` +
    `<mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
}

// horizontal resistor, leads at (x,y) and (x+80,y)
function resistor(x, y, color = C.ink) {
  const pts = [[0, 0], [15, 0], [20, -8], [30, 8], [40, -8], [50, 8], [60, -8], [65, 0], [80, 0]];
  symbol(x, y - 10, 80, 20, `<polyline points="${pts.map(([a, b]) => `${a},${b + 10}`).join(' ')}"/>`, color);
}
// vertical capacitor, top lead at (x,y), bottom lead at (x,y+30); plates 8 apart
function capacitor(x, y) {
  symbol(x - 14, y, 28, 30,
    `<line x1="14" y1="0" x2="14" y2="11"/><line x1="0" y1="11" x2="28" y2="11"/>` +
    `<line x1="0" y1="19" x2="28" y2="19"/><line x1="14" y1="19" x2="14" y2="30"/>`);
}
// vertical diode, conducts bottom -> top. Cathode bar at (x,y), anode lead at (x,y+30)
function diodeUp(x, y, color = C.clamp) {
  symbol(x - 11, y, 22, 30,
    `<line x1="11" y1="0" x2="11" y2="6"/><line x1="0" y1="6" x2="22" y2="6"/>` +
    `<polygon points="0,24 22,24 11,6" fill="#ffffff"/><line x1="11" y1="24" x2="11" y2="30"/>`, color);
}
// ground symbol hanging from (x,y)
function ground(x, y) {
  symbol(x - 12, y, 24, 16,
    `<line x1="12" y1="0" x2="12" y2="6"/><line x1="0" y1="6" x2="24" y2="6"/>` +
    `<line x1="5" y1="11" x2="19" y2="11"/><line x1="9" y1="16" x2="15" y2="16"/>`);
}
// vertical inductor (coil), top lead (x,y), bottom lead (x,y+90)
function inductor(x, y) {
  const bumps = [0, 1, 2, 3].map((i) => `M20,${15 + i * 15} a10,7.5 0 0 1 0,15`).join(' ');
  symbol(x - 20, y, 40, 90, `<line x1="20" y1="0" x2="20" y2="15"/><path d="${bumps}"/><line x1="20" y1="75" x2="20" y2="90"/>`);
}
// open terminal circle
function terminal(x, y, color) {
  svg.push(`<circle cx="${x}" cy="${y}" r="6" fill="#ffffff" stroke="${color}" stroke-width="2.5"/>`);
  cells.push(`<mxCell id="${nid()}" value="" style="ellipse;html=1;fillColor=#ffffff;strokeColor=${color};strokeWidth=2.5;" vertex="1" parent="1">` +
    `<mxGeometry x="${x - 6}" y="${y - 6}" width="12" height="12" as="geometry"/></mxCell>`);
}
function rail3v3(x, y) {
  wire([[x - 12, y], [x + 12, y]], C.clamp);
  text(x + 16, y + 4, '3V3 (pin 36)', { size: 11, color: C.clamp, bold: true });
}

// ---- drawing --------------------------------------------------------------------------------
svg.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`);
text(20, 28, 'CH-R2 — 2-wire resistance meter · schematic (Phase 1)', { size: 18, bold: true });
text(20, 48, 'R_dut = R_REF · V_node / (V_top − V_node)   — only one drive pin is HIGH at a time, the other is INPUT (high-Z)', { size: 11, color: '#475569' });

// Pico
const PX = 20, PY = 70, PW = 160, PH = 520, EDGE = PX + PW;
box(PX, PY, PW, PH, { fill: '#eff6ff', stroke: '#2563eb', label: 'Raspberry Pi Pico 2 W' });
const pins = [
  [110, 'GP14 (pin 19)', C.drv], [160, 'GP27 / ADC1 (pin 32)', C.sense],
  [250, 'GP15 (pin 20)', C.drv], [300, 'GP28 / ADC2 (pin 34)', C.sense],
  [440, 'GP26 / ADC0 (pin 31)', C.sense], [560, 'AGND (pin 33)', C.gnd],
];
for (const [py, label] of pins) text(EDGE - 8, py + 4, label, { size: 11, anchor: 'end', bold: true });

const RX = 340, BUS = 620; // resistor left x, node bus x

// Range 1k: GP14 -> R_REF1 -> bus ; GP27 senses the drive side
wire([[EDGE, 110], [RX, 110]], C.drv);
resistor(RX, 110, C.drv);
wire([[RX + 80, 110], [BUS, 110]], C.drv);
dot(215, 110, C.drv);
wire([[215, 110], [215, 160], [EDGE, 160]], C.sense);
dot(215, 160, C.sense);
wire([[215, 160], [215, 180]], C.sense); capacitor(215, 180); wire([[215, 210], [215, 220]]); ground(215, 220);
text(232, 200, 'C2 100 nF', { size: 10, color: '#475569' });
text(RX + 40, 90, 'R_REF1  1 kΩ 0.1 %', { size: 12, anchor: 'middle', bold: true });
text(RX + 40, 135, '1k range  (≤ 3.3 mA)', { size: 10, anchor: 'middle', color: '#475569' });

// Range 10k
wire([[EDGE, 250], [RX, 250]], C.drv);
resistor(RX, 250, C.drv);
wire([[RX + 80, 250], [BUS, 250]], C.drv);
dot(215, 250, C.drv); dot(BUS, 250, C.drv);
wire([[215, 250], [215, 300], [EDGE, 300]], C.sense);
dot(215, 300, C.sense);
wire([[215, 300], [215, 320]], C.sense); capacitor(215, 320); wire([[215, 350], [215, 358]]); ground(215, 358);
text(232, 340, 'C3 100 nF', { size: 10, color: '#475569' });
text(RX + 40, 230, 'R_REF2  10 kΩ 0.1 %', { size: 12, anchor: 'middle', bold: true });
text(RX + 40, 275, '10k range  (≤ 0.33 mA)', { size: 10, anchor: 'middle', color: '#475569' });

// ADC0 side: GP26 -> junction J (clamp) -> C1 -> R_S -> bus
const JX = 240, JY = 440;
wire([[EDGE, JY], [RX, JY]], C.sense);
dot(JX, JY, C.sense);
rail3v3(JX, 385);
wire([[JX, 385], [JX, 395]], C.clamp);
diodeUp(JX, 395);                  // D1: cathode to 3V3, anode to J
wire([[JX, 425], [JX, JY]], C.clamp);
wire([[JX, JY], [JX, 455]], C.clamp);
diodeUp(JX, 455);                  // D2: cathode to J, anode to GND
wire([[JX, 485], [JX, 505]], C.clamp);
ground(JX, 505);
text(JX + 16, 414, 'D1', { size: 11, color: C.clamp, bold: true });
text(JX + 16, 474, 'D2', { size: 11, color: C.clamp, bold: true });
dot(290, JY, C.sense);
wire([[290, JY], [290, 462]]); capacitor(290, 462); wire([[290, 492], [290, 500]]); ground(290, 500);
text(306, 482, 'C1 100 nF', { size: 10, color: '#475569' });
resistor(RX, JY, C.sense);
wire([[RX + 80, JY], [BUS, JY]], C.sense);
text(RX + 40, 420, 'R_S  1 kΩ', { size: 12, anchor: 'middle', bold: true });
text(RX + 40, 462, 'D1 + D2 = one BAT54S', { size: 10, anchor: 'middle', color: C.clamp });

// Node bus and DUT
wire([[BUS, 110], [BUS, JY]], C.drv);
dot(BUS, 275, C.drv);
text(BUS + 12, 210, 'DUT+ node', { size: 11, bold: true });
text(BUS + 12, 226, '(= V_node, read\nby ADC0 via R_S)', { size: 10, color: '#475569' });
wire([[BUS, 275], [754, 275]], C.drv);
terminal(760, 275, C.drv);
text(748, 262, 'red clip  DUT+', { size: 11, anchor: 'end', bold: true, color: C.drv });
// ground return
wire([[EDGE, 560], [754, 560]], C.gnd);
terminal(760, 560, C.gnd);
text(748, 582, 'black clip  DUT−', { size: 11, anchor: 'end', bold: true });
ground(500, 560); dot(500, 560, C.gnd);
text(516, 548, 'all ground symbols = AGND', { size: 10, color: '#475569' });

box(790, 240, 210, 350, { fill: '#fefce8', stroke: '#ca8a04', dashed: true, label: 'Device under test' });
wire([[766, 275], [860, 275], [860, 360]], C.drv);
inductor(860, 360);
wire([[860, 450], [860, 560], [766, 560]], C.gnd);
text(880, 400, 'coil', { size: 11, bold: true });
text(880, 416, 'R ≈ 20 Ω – 200 kΩ', { size: 10, color: '#475569' });
text(876, 300, 'pickup · exciter ·\nignition secondary', { size: 10, color: '#475569' });

// notes
box(20, 618, 480, 100, { fill: '#f8fafc', stroke: '#94a3b8' });
text(32, 640, 'Notes', { size: 12, bold: true });
text(32, 658, '• Turn-off: drive the pin LOW for 20 ms, then INPUT (coil current decays through R_REF).\n' +
  '• C2, C3, C1 at the Pico pins. Add 10 µF + 100 nF across 3V3 (pin 36) and GND.\n' +
  '• Use AGND (pin 33) as ground for C1–C3, D2 and DUT−. Keep R_S, D1/D2 close to GP26.\n' +
  '• Colours: red = drive, blue = sense, yellow = clamp, black = ground.', { size: 10, color: '#334155' });
box(520, 618, 480, 100, { fill: '#ffedd5', stroke: '#ea580c' });
text(532, 640, '⚠ Low-voltage circuit only (≤ 3.3 V)', { size: 12, bold: true, color: '#9a3412' });
text(532, 658, 'Never connect the clips to a coil that is still wired to a CDI or a running bike.\n' +
  'CDI outputs reach 200–400 V and ignition secondaries 20–40 kV. Disconnect the coil first.\n' +
  'No HV node may reach a Pico pin (see docs/safety.md).', { size: 10, color: '#9a3412' });

// ---- output ---------------------------------------------------------------------------------
const title = 'CH-R2 schematic';
const model = `<mxfile host="bike-coils-tester-generator"><diagram id="d1" name="${esc(title)}">` +
  `<mxGraphModel dx="${W}" dy="${H}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" ` +
  `pageScale="1" pageWidth="${W}" pageHeight="${H}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>` +
  `${cells.join('')}</root></mxGraphModel></diagram></mxfile>`;
const out = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${W}" height="${H}" ` +
  `viewBox="0 0 ${W} ${H}" content="${esc(model)}">\n<title>${esc(title)}</title>\n${svg.join('\n')}\n</svg>\n`;

const path = resolve('hardware/diagrams/ch-r2-schematic.drawio.svg');
if (existsSync(path) && process.argv[2] !== '--force') {
  console.error(`${path} exists (may contain draw.io edits). Use --force to overwrite.`);
  process.exit(1);
}
writeFileSync(path, out);
console.log(`wrote ${path}`);
