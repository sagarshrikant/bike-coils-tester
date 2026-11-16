// Schematic drawing helpers shared by the build-*-schematic.mjs scripts.
// Every symbol is drawn as plain SVG in the picture AND embedded in the draw.io model as an image
// cell, so the file looks the same everywhere and stays editable (move / rename / rewire) in draw.io.
// Coordinates are absolute px. Functions that place a symbol return its connection points.
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const C = {
  drv: '#dc2626', sense: '#2563eb', gnd: '#111827', clamp: '#ca8a04', ink: '#111827',
  dim: '#475569', dig: '#7c3aed', bias: '#0f766e',
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function createSchematic({ W, H, title }) {
  const svg = [`<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`];
  const cells = [];
  let id = 2;
  const nid = () => `c${id++}`;

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
  function box(x, y, w, h, { fill, stroke, dashed = false, label = '', size = 13 } = {}) {
    svg.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"${dashed ? ' stroke-dasharray="6 4"' : ''}/>`);
    if (label) label.split('\n').forEach((l, i) => svg.push(`<text font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="bold" fill="#334155" text-anchor="middle" x="${x + w / 2}" y="${y + 20 + i * (size + 3)}">${esc(l)}</text>`));
    cells.push(`<mxCell id="${nid()}" value="${esc(esc(label).replace(/\n/g, '<br>'))}" style="rounded=1;arcSize=3;html=1;whiteSpace=wrap;${dashed ? 'dashed=1;' : ''}fillColor=${fill};strokeColor=${stroke};verticalAlign=top;fontStyle=1;fontSize=${size};fontColor=#334155;" vertex="1" parent="1">` +
      `<mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
  }
  function symbol(x, y, w, h, body, stroke = C.ink, extraSvg = '') {
    const inner = `<g fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${body}</g>${extraSvg}`;
    svg.push(`<g transform="translate(${x},${y})">${inner}</g>`);
    const standalone = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
    cells.push(`<mxCell id="${nid()}" value="" style="shape=image;html=1;verticalLabelPosition=bottom;aspect=fixed;imageAspect=0;image=data:image/svg+xml,${Buffer.from(standalone).toString('base64')};" vertex="1" parent="1">` +
      `<mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
  }

  // ---- symbols ----
  // horizontal resistor: leads at (x,y) and (x+80,y)
  function resistorH(x, y, color = C.ink) {
    const pts = [[0, 0], [15, 0], [20, -8], [30, 8], [40, -8], [50, 8], [60, -8], [65, 0], [80, 0]];
    symbol(x, y - 10, 80, 20, `<polyline points="${pts.map(([a, b]) => `${a},${b + 10}`).join(' ')}"/>`, color);
    return { a: [x, y], b: [x + 80, y] };
  }
  // vertical resistor: leads at (x,y) and (x,y+80)
  function resistorV(x, y, color = C.ink) {
    const pts = [[0, 0], [15, 0], [20, -8], [30, 8], [40, -8], [50, 8], [60, -8], [65, 0], [80, 0]];
    symbol(x - 10, y, 20, 80, `<polyline points="${pts.map(([a, b]) => `${b + 10},${a}`).join(' ')}"/>`, color);
    return { a: [x, y], b: [x, y + 80] };
  }
  // vertical capacitor: top lead (x,y), bottom lead (x,y+30)
  function capacitor(x, y) {
    symbol(x - 14, y, 28, 30,
      `<line x1="14" y1="0" x2="14" y2="11"/><line x1="0" y1="11" x2="28" y2="11"/><line x1="0" y1="19" x2="28" y2="19"/><line x1="14" y1="19" x2="14" y2="30"/>`);
    return { a: [x, y], b: [x, y + 30] };
  }
  // vertical diode, conducts bottom -> top. Cathode bar at (x,y), anode lead at (x,y+30)
  function diodeUp(x, y, color = C.clamp) {
    symbol(x - 11, y, 22, 30,
      `<line x1="11" y1="0" x2="11" y2="6"/><line x1="0" y1="6" x2="22" y2="6"/><polygon points="0,24 22,24 11,6" fill="#ffffff"/><line x1="11" y1="24" x2="11" y2="30"/>`, color);
    return { cathode: [x, y], anode: [x, y + 30] };
  }
  // vertical diode, conducts top -> bottom. Anode lead at (x,y), cathode bar at (x,y+30)
  function diodeDown(x, y, color = C.clamp) {
    symbol(x - 11, y, 22, 30,
      `<line x1="11" y1="0" x2="11" y2="6"/><polygon points="0,6 22,6 11,24" fill="#ffffff"/><line x1="0" y1="24" x2="22" y2="24"/><line x1="11" y1="24" x2="11" y2="30"/>`, color);
    return { anode: [x, y], cathode: [x, y + 30] };
  }
  // bidirectional TVS, vertical: leads at (x,y) and (x,y+60)
  function tvs(x, y, color = C.clamp) {
    symbol(x - 12, y, 24, 60,
      `<line x1="12" y1="0" x2="12" y2="12"/><polygon points="0,12 24,12 12,30" fill="#ffffff"/><polygon points="0,48 24,48 12,30" fill="#ffffff"/>` +
      `<line x1="0" y1="12" x2="24" y2="12"/><line x1="0" y1="48" x2="24" y2="48"/><line x1="12" y1="48" x2="12" y2="60"/>`, color);
    return { a: [x, y], b: [x, y + 60] };
  }
  // ground symbol hanging from (x,y)
  function ground(x, y) {
    symbol(x - 12, y, 24, 16,
      `<line x1="12" y1="0" x2="12" y2="6"/><line x1="0" y1="6" x2="24" y2="6"/><line x1="5" y1="11" x2="19" y2="11"/><line x1="9" y1="16" x2="15" y2="16"/>`);
  }
  // supply bar at (x,y) with a label to its right
  function rail(x, y, label, color = C.clamp) {
    wire([[x - 12, y], [x + 12, y]], color);
    text(x + 16, y + 4, label, { size: 11, color, bold: true });
  }
  function terminal(x, y, color) {
    svg.push(`<circle cx="${x}" cy="${y}" r="6" fill="#ffffff" stroke="${color}" stroke-width="2.5"/>`);
    cells.push(`<mxCell id="${nid()}" value="" style="ellipse;html=1;fillColor=#ffffff;strokeColor=${color};strokeWidth=2.5;" vertex="1" parent="1">` +
      `<mxGeometry x="${x - 6}" y="${y - 6}" width="12" height="12" as="geometry"/></mxCell>`);
  }
  // vertical SPST switch: leads at (x,y) and (x,y+40). The control label sits to the right.
  function switchV(x, y, ctrl = '', color = C.ink) {
    symbol(x - 12, y, 24, 40,
      `<line x1="12" y1="0" x2="12" y2="10"/><line x1="12" y1="10" x2="22" y2="28"/><line x1="12" y1="30" x2="12" y2="40"/>` +
      `<line x1="6" y1="30" x2="18" y2="30"/>`, color);
    if (ctrl) text(x + 18, y + 22, ctrl, { size: 10, color: C.dig, bold: true });
    return { a: [x, y], b: [x, y + 40] };
  }
  // vertical fuse: leads at (x,y) and (x,y+40)
  function fuseV(x, y, color = C.ink) {
    symbol(x - 8, y, 16, 40,
      `<line x1="8" y1="0" x2="8" y2="8"/><rect x="2" y="8" width="12" height="24" fill="#ffffff"/><line x1="8" y1="8" x2="8" y2="32"/><line x1="8" y1="32" x2="8" y2="40"/>`, color);
    return { a: [x, y], b: [x, y + 40] };
  }
  // P-channel MOSFET, bbox 40 x 60 at (x,y). Normal: drain top, source bottom. flip: source top, drain bottom.
  // Gate lead ends at the left edge (x, y+30).
  function pmos(x, y, { flip = false, color = C.ink } = {}) {
    const f = (v) => (flip ? 60 - v : v);
    const body =
      `<path d="M0,30 H12 M12,${f(14)} V${f(46)} M18,${f(10)} V${f(22)} M18,${f(26)} V${f(34)} M18,${f(38)} V${f(50)} ` +
      `M18,${f(16)} H38 V${f(0)} M18,${f(44)} H38 V${f(60)} M18,30 H38 M38,${f(30)} V${f(44)}"/>` +
      `<polygon points="31,26 38,30 31,34" fill="${color}"/>`;
    symbol(x, y, 40, 60, body, color);
    return flip
      ? { d: [x + 38, y + 60], s: [x + 38, y], g: [x, y + 30] }
      : { d: [x + 38, y], s: [x + 38, y + 60], g: [x, y + 30] };
  }
  // N-channel MOSFET, bbox 40 x 60 at (x,y). Drain top, source bottom. mirror: gate on the right.
  function nmos(x, y, { mirror = false, color = C.ink } = {}) {
    const m = (v) => (mirror ? 40 - v : v);
    const body =
      `<path d="M${m(0)},30 H${m(12)} M${m(12)},14 V46 M${m(18)},10 V22 M${m(18)},26 V34 M${m(18)},38 V50 ` +
      `M${m(18)},16 H${m(38)} V0 M${m(18)},44 H${m(38)} V60 M${m(18)},30 H${m(38)} M${m(38)},30 V44"/>` +
      `<polygon points="${m(25)},26 ${m(18)},30 ${m(25)},34" fill="${color}"/>`;
    symbol(x, y, 40, 60, body, color);
    return mirror
      ? { d: [x + 2, y], s: [x + 2, y + 60], g: [x + 40, y + 30] }
      : { d: [x + 38, y], s: [x + 38, y + 60], g: [x, y + 30] };
  }
  // relay coil, vertical: leads at (x,y) and (x,y+80)
  function coilV(x, y, color = C.ink) {
    symbol(x - 12, y, 24, 80,
      `<line x1="12" y1="0" x2="12" y2="15"/><rect x="2" y="15" width="20" height="50" fill="#ffffff"/><line x1="2" y1="15" x2="22" y2="65"/><line x1="12" y1="65" x2="12" y2="80"/>`, color);
    return { a: [x, y], b: [x, y + 80] };
  }
  // op-amp / comparator triangle pointing right at (x,y), size w x h. plusTop puts '+' on the upper input.
  function opamp(x, y, label = '', { w = 70, h = 60, plusTop = true } = {}) {
    const top = [x, y + 15], bot = [x, y + h - 15], out = [x + w, y + h / 2];
    const pm = (cy, sign) => `<text x="5" y="${cy + 4}" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="${C.ink}" font-weight="bold">${sign}</text>`;
    symbol(x, y, w, h, `<polygon points="0,0 0,${h} ${w},${h / 2}" fill="#ffffff"/>`, C.ink,
      pm(15, plusTop ? '+' : '−') + pm(h - 15, plusTop ? '−' : '+'));
    if (label) text(x + 20, y - 6, label, { size: 11, bold: true });
    return plusTop ? { inP: top, inN: bot, out } : { inP: bot, inN: top, out };
  }
  // IC box with pin labels on the left and right. Returns {pinName: [x,y]} at the outer end of each stub.
  function icBox(x, y, w, titleText, left = [], right = [], { pitch = 26, fill = '#f8fafc', stroke = '#334155' } = {}) {
    const n = Math.max(left.length, right.length);
    const h = 40 + n * pitch;
    box(x, y, w, h, { fill, stroke, label: titleText, size: 12 });
    const pins = {};
    const place = (arr, side) => arr.forEach((name, i) => {
      if (!name) return;
      const py = y + 44 + i * pitch;
      const x0 = side === 'l' ? x : x + w, x1 = side === 'l' ? x - 16 : x + w + 16;
      wire([[x0, py], [x1, py]], C.ink);
      text(side === 'l' ? x + 6 : x + w - 6, py + 4, name, { size: 10, anchor: side === 'l' ? 'start' : 'end' });
      pins[name] = [x1, py];
    });
    place(left, 'l'); place(right, 'r');
    return { pins, h };
  }

  function finish(fileName, label) {
    const model = `<mxfile host="bike-coils-tester-generator"><diagram id="d1" name="${esc(label)}">` +
      `<mxGraphModel dx="${W}" dy="${H}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" ` +
      `pageScale="1" pageWidth="${W}" pageHeight="${H}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>` +
      `${cells.join('')}</root></mxGraphModel></diagram></mxfile>`;
    const out = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${W}" height="${H}" ` +
      `viewBox="0 0 ${W} ${H}" content="${esc(model)}">\n<title>${esc(label)}</title>\n${svg.join('\n')}\n</svg>\n`;
    const path = resolve('hardware/diagrams', fileName);
    if (existsSync(path) && process.argv[2] !== '--force') {
      console.error(`${path} exists (may contain draw.io edits). Use --force to overwrite.`);
      process.exit(1);
    }
    writeFileSync(path, out);
    console.log(`wrote ${path}`);
  }

  return { wire, dot, text, box, symbol, resistorH, resistorV, capacitor, diodeUp, diodeDown, tvs, ground, rail, terminal, switchV, fuseV, pmos, nmos, coilV, opamp, icBox, finish };
}
