// Builds an SVG that renders in any viewer AND embeds a draw.io model (the `content` attribute),
// so the file opens for editing in draw.io / app.diagrams.net.
//
// Spec format (all coordinates in px, absolute):
//   { title, width, height,
//     groups: [{ id, x, y, w, h, label, fill, stroke }],                 // dashed containers, drawn first
//     nodes:  [{ id, x, y, w, h, label, fill, stroke, fontColor, bold, fontSize }],
//     edges:  [{ id?, from, to, fromSide, toSide, fromPos?, toPos?, label?, color?, dashed?,
//                both?, arrow?, viaX?, viaY? }] }   arrow:false = plain wire, no arrowheads
//   sides: 'left' | 'right' | 'top' | 'bottom'; pos: 0..1 along that side (default 0.5)
//   label: use '\n' for line breaks.

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function anchor(n, side, pos = 0.5) {
  switch (side) {
    case 'left': return { x: n.x, y: n.y + n.h * pos, ex: 0, ey: pos, horiz: true };
    case 'right': return { x: n.x + n.w, y: n.y + n.h * pos, ex: 1, ey: pos, horiz: true };
    case 'top': return { x: n.x + n.w * pos, y: n.y, ex: pos, ey: 0, horiz: false };
    case 'bottom': return { x: n.x + n.w * pos, y: n.y + n.h, ex: pos, ey: 1, horiz: false };
    default: throw new Error(`bad side ${side}`);
  }
}

// Orthogonal route: returns the intermediate waypoints between the source and target anchors.
function route(a, b, e) {
  if (a.horiz && b.horiz) {
    if (a.y === b.y && e.viaX === undefined) return [];
    const mx = e.viaX ?? Math.round((a.x + b.x) / 2);
    return [{ x: mx, y: a.y }, { x: mx, y: b.y }];
  }
  if (!a.horiz && !b.horiz) {
    if (a.x === b.x && e.viaY === undefined) return [];
    const my = e.viaY ?? Math.round((a.y + b.y) / 2);
    return [{ x: a.x, y: my }, { x: b.x, y: my }];
  }
  return a.horiz ? [{ x: b.x, y: a.y }] : [{ x: a.x, y: b.y }];
}

function textSvg(cx, cy, label, { size = 12, color = '#1f2937', bold = false } = {}) {
  const lines = String(label).split('\n');
  const lh = size * 1.25;
  const y0 = cy - ((lines.length - 1) * lh) / 2;
  const tspans = lines
    .map((l, i) => `<tspan x="${cx}" y="${(y0 + i * lh).toFixed(1)}">${esc(l)}</tspan>`)
    .join('');
  return `<text font-family="Helvetica, Arial, sans-serif" font-size="${size}" fill="${color}" ` +
    `text-anchor="middle" dominant-baseline="central"${bold ? ' font-weight="bold"' : ''}>${tspans}</text>`;
}

export function build(spec) {
  const { width, height, title = 'Diagram', groups = [], nodes = [], edges = [] } = spec;
  const byId = Object.fromEntries([...groups, ...nodes].map((n) => [n.id, n]));
  const cells = [];
  const svg = [];

  svg.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>`);

  for (const g of groups) {
    const fill = g.fill ?? '#f8fafc', stroke = g.stroke ?? '#94a3b8';
    svg.push(`<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="8" fill="${fill}" ` +
      `stroke="${stroke}" stroke-dasharray="6 4" stroke-width="1.5"/>`);
    svg.push(textSvg(g.x + g.w / 2, g.y + 14, g.label, { size: 13, bold: true, color: '#334155' }));
    cells.push(`<mxCell id="${esc(g.id)}" value="${esc(esc(g.label).replace(/\n/g, '<br>'))}" ` +
      `style="rounded=1;arcSize=3;whiteSpace=wrap;html=1;dashed=1;fillColor=${fill};strokeColor=${stroke};` +
      `verticalAlign=top;fontStyle=1;fontSize=13;fontColor=#334155;" vertex="1" parent="1">` +
      `<mxGeometry x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" as="geometry"/></mxCell>`);
  }

  for (const n of nodes) {
    const fill = n.fill ?? '#ffffff', stroke = n.stroke ?? '#475569', fc = n.fontColor ?? '#1f2937';
    const size = n.fontSize ?? 12;
    svg.push(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6" fill="${fill}" ` +
      `stroke="${stroke}" stroke-width="1.5"/>`);
    svg.push(textSvg(n.x + n.w / 2, n.y + n.h / 2, n.label, { size, color: fc, bold: n.bold }));
    cells.push(`<mxCell id="${esc(n.id)}" value="${esc(esc(n.label).replace(/\n/g, '<br>'))}" ` +
      `style="rounded=1;arcSize=8;whiteSpace=wrap;html=1;fillColor=${fill};strokeColor=${stroke};` +
      `fontColor=${fc};fontSize=${size};${n.bold ? 'fontStyle=1;' : ''}" vertex="1" parent="1">` +
      `<mxGeometry x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" as="geometry"/></mxCell>`);
  }

  let markerIds = new Set();
  edges.forEach((e, i) => {
    const s = byId[e.from], t = byId[e.to];
    if (!s || !t) throw new Error(`edge ${i}: unknown node ${!s ? e.from : e.to}`);
    const a = anchor(s, e.fromSide, e.fromPos), b = anchor(t, e.toSide, e.toPos);
    const pts = route(a, b, e);
    const color = e.color ?? '#475569';
    const mid = color.replace('#', '');
    markerIds.add(mid);
    const all = [a, ...pts, b];
    svg.push(`<polyline points="${all.map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" ` +
      `stroke="${color}" stroke-width="1.6"${e.dashed ? ' stroke-dasharray="5 4"' : ''} ` +
      `${e.arrow === false ? '' : `marker-end="url(#arr-${mid})"`}${e.both ? ` marker-start="url(#arr-${mid})"` : ''}/>`);
    if (e.label) {
      // label on the longest segment
      let best = 0, bl = -1;
      for (let k = 0; k < all.length - 1; k++) {
        const l = Math.abs(all[k + 1].x - all[k].x) + Math.abs(all[k + 1].y - all[k].y);
        if (l > bl) { bl = l; best = k; }
      }
      const cx = (all[best].x + all[best + 1].x) / 2, cy = (all[best].y + all[best + 1].y) / 2;
      const lines = e.label.split('\n');
      const w = Math.max(...lines.map((l) => l.length)) * 6 + 8, h = lines.length * 13 + 4;
      svg.push(`<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="#ffffff" opacity="0.9"/>`);
      svg.push(textSvg(cx, cy, e.label, { size: 10, color }));
    }
    const pointsXml = pts.length
      ? `<Array as="points">${pts.map((p) => `<mxPoint x="${p.x}" y="${p.y}"/>`).join('')}</Array>` : '';
    cells.push(`<mxCell id="${esc(e.id ?? `e${i}`)}" value="${esc(esc(e.label ?? '').replace(/\n/g, '<br>'))}" ` +
      `style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;fontSize=10;fontColor=${color};strokeColor=${color};` +
      `strokeWidth=1.6;exitX=${a.ex};exitY=${a.ey};exitDx=0;exitDy=0;entryX=${b.ex};entryY=${b.ey};entryDx=0;entryDy=0;` +
      `${e.arrow === false ? 'endArrow=none;' : 'endArrow=block;endFill=1;'}${e.both ? 'startArrow=block;startFill=1;' : ''}${e.dashed ? 'dashed=1;' : ''}" ` +
      `edge="1" parent="1" source="${esc(e.from)}" target="${esc(e.to)}">` +
      `<mxGeometry relative="1" as="geometry">${pointsXml}</mxGeometry></mxCell>`);
  });

  const model = `<mxfile host="bike-coils-tester-generator"><diagram id="d1" name="${esc(title)}">` +
    `<mxGraphModel dx="${width}" dy="${height}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" ` +
    `arrows="1" fold="1" page="1" pageScale="1" pageWidth="${width}" pageHeight="${height}" math="0" shadow="0">` +
    `<root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}</root></mxGraphModel></diagram></mxfile>`;

  const defs = [...markerIds].map((m) =>
    `<marker id="arr-${m}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
    `<path d="M0,0 L10,5 L0,10 z" fill="#${m}"/></marker>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}" content="${esc(model)}">\n<title>${esc(title)}</title>\n` +
    `<defs>${defs}</defs>\n${svg.join('\n')}\n</svg>\n`;
}
