#!/usr/bin/env node
// Cross-sheet check: counts every global label over all generated mainboard sheets and lists the nets that appear only once
// (a label that connects to nothing) or only on one sheet with a single pin.
import { readFileSync, readdirSync } from 'node:fs';
const dir = 'hardware/kicad/mainboard';
const files = readdirSync(dir).filter((f) => /^mainboard-.*\.kicad_sch$/.test(f));
const count = new Map(), sheets = new Map();
for (const f of files) {
  const t = readFileSync(`${dir}/${f}`, 'utf8');
  for (const m of t.matchAll(/\(global_label "([^"]+)"/g)) {
    count.set(m[1], (count.get(m[1]) ?? 0) + 1);
    (sheets.get(m[1]) ?? sheets.set(m[1], new Set()).get(m[1])).add(f.replace(/^mainboard-|\.kicad_sch$/g, ''));
  }
}
console.log(`${files.length} sheets, ${count.size} nets`);
const single = [...count].filter(([, n]) => n === 1).map(([k]) => k);
console.log('nets with a single label (connect to nothing):', single.length ? single.join(', ') : 'none');
const cross = [...sheets].filter(([, s]) => s.size > 1).map(([k]) => k);
console.log(`nets shared between sheets: ${cross.length}`);
