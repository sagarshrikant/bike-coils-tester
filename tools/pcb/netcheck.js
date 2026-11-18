#!/usr/bin/env node
// Routing helper: shows which pads of a net are joined by tracks, vias and filled zones.
// usage: node tools/pcb/netcheck.js <file.kicad_pcb> <NET> [<NET> ...]     (or: --all to list every net's state, or --pads <NET>... to print pad coordinates)
// It is a helper for the guided routing, not a replacement for KiCad's DRC.
const fs = require("fs");
const [,, file, ...nets] = process.argv;
if (!file || !nets.length) { console.log("usage: netcheck.js <file.kicad_pcb> <NET>... | --all"); process.exit(1); }
const s = fs.readFileSync(file, "utf8");

// ---- pads (absolute positions)
const pads = [];
for (const fp of s.split("\n\t(footprint ").slice(1)) {
  const ref = /\(property "Reference" "([^"]+)"/.exec(fp)[1];
  const at = /\(at ([\d.\-]+) ([\d.\-]+)(?: ([\d.\-]+))?\)/.exec(fp);
  const fx = +at[1], fy = +at[2], rot = +(at[3] || 0);
  const flipped = /^\(?"[^"]*"\s*\n\t\t\(layer "B\.Cu"\)/.test(fp);
  const c = Math.cos((rot * Math.PI) / 180), sn = Math.sin((rot * Math.PI) / 180);
  for (const m of fp.matchAll(/\(pad "([^"]*)" (\w+) (\w+)\s+\(at ([\d.\-]+) ([\d.\-]+)(?: [\d.\-]+)?\)\s+\(size ([\d.]+) ([\d.]+)\)([\s\S]*?)\n\t\t\)/g)) {
    const net = /\(net "([^"]*)"\)/.exec(m[8]);
    if (!net) continue;
    const px = +m[4], py = +m[5];
    // KiCad: positive rotation is counter-clockwise on screen, y points down
    const x = fx + px * c + py * sn, y = fy - px * sn + py * c;
    const layers = m[2] === "thru_hole" || m[2] === "np_thru_hole" ? ["F.Cu", "B.Cu"] : [flipped ? "B.Cu" : "F.Cu"];
    pads.push({ ref, num: m[1], net: net[1], x, y, r: Math.max(+m[6], +m[7]) / 2, layers });
  }
}
// ---- tracks, vias
const segs = [...s.matchAll(/\n\t\(segment\s+\(start ([\d.\-]+) ([\d.\-]+)\)\s+\(end ([\d.\-]+) ([\d.\-]+)\)\s+\(width [\d.]+\)\s+\(layer "([^"]+)"\)\s+\(net "([^"]*)"\)/g)]
  .map((m) => ({ a: [+m[1], +m[2]], b: [+m[3], +m[4]], layer: m[5], net: m[6] }));
const vias = [...s.matchAll(/\n\t\(via\s+\(at ([\d.\-]+) ([\d.\-]+)\)[\s\S]*?\(net "([^"]*)"\)/g)].map((m) => ({ x: +m[1], y: +m[2], net: m[3] }));
// ---- filled zones
const zones = [];
for (const z of s.split("\n\t(zone").slice(1)) {
  const net = /\(net "([^"]*)"\)/.exec(z); if (!net) continue;
  for (const fpoly of z.matchAll(/\(filled_polygon\s+\(layer "([^"]+)"\)\s+\(pts([\s\S]*?)\)\s+\)/g)) {
    const pts = [...fpoly[2].matchAll(/\(xy ([\d.\-]+) ([\d.\-]+)\)/g)].map((m) => [+m[1], +m[2]]);
    zones.push({ net: net[1], layer: fpoly[1], pts });
  }
}
const inPoly = (x, y, pts) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; };

function check(net) {
  const P = pads.filter((p) => p.net === net);
  if (!P.length) return { net, pads: 0, text: "no such net or no pads" };
  // union-find over nodes: pads, segment endpoints, vias
  const nodes = []; const parent = [];
  const add = (o) => { nodes.push(o); parent.push(parent.length); return nodes.length - 1; };
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const uni = (a, b) => { parent[find(a)] = find(b); };
  const pn = P.map((p) => add({ kind: "pad", p }));
  const near = (x1, y1, x2, y2, r) => Math.hypot(x1 - x2, y1 - y2) <= r;
  const sg = segs.filter((g) => g.net === net);
  const sn = sg.map((g) => [add({ kind: "end", x: g.a[0], y: g.a[1], layer: g.layer }), add({ kind: "end", x: g.b[0], y: g.b[1], layer: g.layer })]);
  sn.forEach(([a, b]) => uni(a, b));
  const vn = vias.filter((v) => v.net === net).map((v) => add({ kind: "via", x: v.x, y: v.y }));
  const zn = zones.filter((z) => z.net === net).map((z) => add({ kind: "zone", z }));
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i], b = nodes[j];
    const pos = (o) => (o.kind === "pad" ? [o.p.x, o.p.y] : [o.x, o.y]);
    if (a.kind === "zone" || b.kind === "zone") {
      const [zn_, o] = a.kind === "zone" ? [a, b] : [b, a]; if (o.kind === "zone") continue;
      const [x, y] = pos(o); const lay = o.kind === "pad" ? o.p.layers : o.kind === "end" ? [o.layer] : ["F.Cu", "B.Cu"];
      if (lay.includes(zn_.z.layer) && inPoly(x, y, zn_.z.pts)) uni(i, j);
      continue;
    }
    const [x1, y1] = pos(a), [x2, y2] = pos(b);
    const la = a.kind === "pad" ? a.p.layers : a.kind === "end" ? [a.layer] : ["F.Cu", "B.Cu"];
    const lb = b.kind === "pad" ? b.p.layers : b.kind === "end" ? [b.layer] : ["F.Cu", "B.Cu"];
    if (!la.some((l) => lb.includes(l))) continue;
    const r = Math.max(a.kind === "pad" ? a.p.r : 0.05, b.kind === "pad" ? b.p.r : 0.05);
    if (near(x1, y1, x2, y2, r)) uni(i, j);
  }
  const groups = {}; pn.forEach((n) => { (groups[find(n)] ||= []).push(nodes[n].p.ref + "." + nodes[n].p.num); });
  const g = Object.values(groups);
  return { net, pads: P.length, tracks: sg.length, vias: vn.length, zones: zn.length, groups: g, done: g.length === 1 };
}

if (nets[0] === "--pads") { for (const n of nets.slice(1)) { console.log(n + ":"); for (const p of pads.filter((q) => q.net === n)) console.log("   " + (p.ref + "." + p.num).padEnd(9) + " x " + p.x.toFixed(2) + "  y " + p.y.toFixed(2)); } process.exit(0); }
const list = nets[0] === "--all" ? [...new Set(pads.map((p) => p.net))].sort() : nets;
let open = 0, routed = 0;
for (const n of list) {
  const r = check(n);
  if (r.text) { console.log(n.padEnd(14), r.text); continue; }
  if (r.pads < 2) continue;
  if (r.done) { routed++; if (nets[0] !== "--all") console.log(`${n.padEnd(14)} ROUTED  (${r.pads} pads, ${r.tracks} tracks, ${r.vias} vias, ${r.zones} zones)`); }
  else { open++; console.log(`${n.padEnd(14)} OPEN    ${r.groups.length} separate pieces: ` + r.groups.map((g) => "[" + g.join(" ") + "]").join(" ")); }
}
if (nets[0] === "--all") console.log(`\n${routed} nets fully routed, ${open} open`);
