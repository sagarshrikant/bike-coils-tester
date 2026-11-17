// Small helper to write a KiCad 10 schematic sheet where every pin carries a net label (a "netlist-style" sheet).
// Symbols come from the official KiCad symbol library (a checkout of kicad-symbols, folders *.kicad_symdir).
// Set KICAD_SYMBOLS to that checkout, or KICAD_LIBS to the folder that contains `kicad-symbols`.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

const uuid = () => randomUUID();
const r2 = (n) => Math.round(n * 100) / 100;

function symbolsRoot() {
  const c = [process.env.KICAD_SYMBOLS, process.env.KICAD_LIBS && join(process.env.KICAD_LIBS, 'kicad-symbols'), process.env.HOME && join(process.env.HOME, 'kicad-libs', 'kicad-symbols')].filter(Boolean);
  for (const p of c) if (existsSync(join(p, 'Device.kicad_symdir'))) return p;
  throw new Error('KiCad symbol library not found. Set KICAD_SYMBOLS=<path to kicad-symbols>. Tried: ' + c.join(', '));
}

function matchParen(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')') { depth--; if (depth === 0) return i + 1; }
  }
  throw new Error('unbalanced');
}

function readSymbolFile(lib, name) {
  const file = join(symbolsRoot(), `${lib}.kicad_symdir`, `${name}.kicad_sym`);
  const t = readFileSync(file, 'utf8');
  const start = t.indexOf(`(symbol "${name}"`);
  if (start < 0) throw new Error(`symbol ${name} not found in ${file}`);
  return t.slice(start, matchParen(t, start));
}

// returns the symbol text with the qualified name "Lib:Name", flattening one level of `extends`
export function loadSymbol(libId) {
  const [lib, name] = libId.split(':');
  let block = readSymbolFile(lib, name);
  const ext = block.match(/\(extends "([^"]+)"\)/);
  if (ext) {
    const base = readSymbolFile(lib, ext[1]);
    const valueOf = (b, key) => (b.match(new RegExp(`\\(property "${key}" "([^"]*)"`)) ?? [])[1];
    let merged = base.split(`"${ext[1]}_`).join(`"${name}_`).replace(`(symbol "${ext[1]}"`, `(symbol "${name}"`);
    for (const key of ['Value', 'Footprint', 'Datasheet', 'Description']) {
      const v = valueOf(block, key);
      if (v !== undefined) merged = merged.replace(new RegExp(`(\\(property "${key}" )"[^"]*"`), `$1"${v.replace(/\$/g, '$$$$')}"`);
    }
    // sub-symbol names inside carry the base name: rename them to the derived name
    block = merged;
  }
  block = block.replace(`(symbol "${name}"`, `(symbol "${libId}"`);
  return block;
}

export function parsePins(block) {
  const pins = new Map();
  const re = /\(pin (\w+) (\w+)\s*\(at ([-\d.]+) ([-\d.]+) (\d+)\)\s*\(length ([\d.]+)\)(?:\s*\(hide yes\))?\s*\(name "([^"]*)"[\s\S]*?\(number "([^"]*)"/g;
  for (const m of block.matchAll(re)) if (!pins.has(m[8])) pins.set(m[8], { x: +m[3], y: +m[4], a: +m[5], name: m[7], num: m[8] });
  return pins;
}

// pins per unit: Map(unit -> Map(number -> pin)); unit 0 holds pins common to all units
export function parseUnits(block) {
  const units = new Map();
  const heads = [...block.matchAll(/\(symbol "[^"]*?_(\d+)_(\d+)"/g)].map((m) => ({ u: +m[1], i: m.index }));
  heads.forEach((h, k) => {
    const end = k + 1 < heads.length ? heads[k + 1].i : block.length;
    const cur = units.get(h.u) ?? new Map();
    for (const [n, p] of parsePins(block.slice(h.i, end))) cur.set(n, p);
    units.set(h.u, cur);
  });
  return units;
}

export class Sheet {
  constructor(title) { this.title = title; this.rootUuid = uuid(); this.libs = new Map(); this.netlist = new Map(); this.items = []; this.warn = []; }
  lib(libId) {
    if (!this.libs.has(libId)) { const block = loadSymbol(libId); this.libs.set(libId, { block, pins: parsePins(block), units: parseUnits(block) }); }
    return this.libs.get(libId);
  }
  // place a symbol; netmap keys are pin numbers (or pin names); rot 0 or 90 (counter-clockwise)
  place({ libId, ref, value, footprint = '', x, y, rot = 0, nets = {}, nc = [], datasheet = '', unit = 1, dnp = false }) {
    const lib = this.lib(libId);
    const multi = [...lib.units.keys()].filter((u) => u > 0).length > 1;
    const pins = multi ? new Map([...(lib.units.get(0) ?? []), ...(lib.units.get(unit) ?? [])]) : lib.pins;
    const byName = new Map([...pins.values()].filter((p) => p.name).map((p) => [p.name, p]));
    const ang = (a) => (a + rot) % 360;
    const world = (p) => {
      const [rx, ry] = rot === 90 ? [-p.y, p.x] : [p.x, p.y];
      return [r2(x + rx), r2(y - ry)];
    };
    const puid = [...pins.keys()].map((n) => `\t\t(pin "${n}"\n\t\t\t(uuid "${uuid()}")\n\t\t)`).join('\n');
    const fx = '(effects (font (size 1.27 1.27)))';
    this.items.push(`\t(symbol
\t\t(lib_id "${libId}")
\t\t(at ${x} ${y} ${rot})
\t\t(unit ${unit})
\t\t(body_style 1)
\t\t(exclude_from_sim no)
\t\t(in_bom yes)
\t\t(on_board yes)
\t\t(in_pos_files yes)
\t\t(dnp ${dnp ? 'yes' : 'no'})
\t\t(uuid "${uuid()}")
\t\t(property "Reference" "${ref}" (at ${x} ${r2(y - 6.5)} 0) (show_name no) (do_not_autoplace no) ${fx})
\t\t(property "Value" "${String(value).replace(/"/g, "'")}" (at ${x} ${r2(y + 6.5)} 0) (show_name no) (do_not_autoplace no) ${fx})
\t\t(property "Footprint" "${footprint}" (at ${x} ${y} 0) (hide yes) (show_name no) (do_not_autoplace no) ${fx})
\t\t(property "Datasheet" "${datasheet}" (at ${x} ${y} 0) (hide yes) (show_name no) (do_not_autoplace no) ${fx})
${puid}
		(instances
			(project "mainboard"
				(path "/${this.rootUuid}"
					(reference "${ref}")
					(unit ${unit})
				)
			)
		)
\t)`);
    const used = new Set();
    for (const [key, net] of Object.entries(nets)) {
      const p = pins.get(String(key)) ?? byName.get(String(key));
      if (!p) { this.warn.push(`${ref}: no pin ${key}`); continue; }
      used.add(p.num);
      (this.netlist.get(net) ?? this.netlist.set(net, []).get(net)).push(`${ref}.${p.num}${p.name ? '(' + p.name + ')' : ''}`);
      const [lx, ly] = world(p);
      const la = (ang(p.a) + 180) % 360;
      this.items.push(`\t(global_label "${net}"
\t\t(shape bidirectional)
\t\t(at ${lx} ${ly} ${la})
\t\t(effects (font (size 1.27 1.27)) (justify ${la === 180 ? 'right' : 'left'}))
\t\t(uuid "${uuid()}")
\t\t(property "Intersheetrefs" "\${INTERSHEET_REFS}" (at ${lx} ${ly} 0) (show_name no) (do_not_autoplace no) (hide yes) ${fx})
\t)`);
    }
    for (const key of nc) {
      const p = pins.get(String(key)) ?? byName.get(String(key));
      if (!p) { this.warn.push(`${ref}: no pin ${key} (nc)`); continue; }
      used.add(p.num);
      const [lx, ly] = world(p);
      this.items.push(`\t(no_connect\n\t\t(at ${lx} ${ly})\n\t\t(uuid "${uuid()}")\n\t)`);
    }
    const open = [...pins.keys()].filter((n) => !used.has(n));
    if (open.length) this.warn.push(`${ref}: pins without net: ${open.join(', ')}`);
  }
  // two-terminal part (R, C, fuse) laid out left-right at (x, y): pin 1 is on the left after the 90-degree turn
  two(libId, ref, value, footprint, x, y, left, right) {
    this.place({ libId, ref, value, footprint, x, y, rot: 90, nets: { 1: left, 2: right } });
  }
  // diode or LED, drawn left-right: pin 1 = K (left), pin 2 = A (right)
  diode(libId, ref, value, footprint, x, y, anode, cathode) {
    this.place({ libId, ref, value, footprint, x, y, rot: 0, nets: { 1: cathode, 2: anode } });
  }
  note(x, y, text, size = 1.27) {
    this.items.push(`\t(text "${text.replace(/"/g, "'").replace(/\n/g, '\\n')}"\n\t\t(exclude_from_sim no)\n\t\t(at ${x} ${y} 0)\n\t\t(effects (font (size ${size} ${size})) (justify left top))\n\t\t(uuid "${uuid()}")\n\t)`);
  }
  box(x, y, w, h) {
    this.items.push(`\t(rectangle\n\t\t(start ${x} ${y})\n\t\t(end ${x + w} ${y + h})\n\t\t(stroke (width 0.2) (type dash))\n\t\t(fill (type none))\n\t\t(uuid "${uuid()}")\n\t)`);
  }
  write(path, paper = 'A3') {
    const libs = [...this.libs.values()].map((l) => l.block.split('\n').map((ln) => '\t' + ln).join('\n')).join('\n');
    const text = `(kicad_sch\n\t(version 20260306)\n\t(generator "eeschema")\n\t(generator_version "10.0")\n\t(uuid "${this.rootUuid}")\n\t(paper "${paper}")\n\t(lib_symbols\n${libs}\n\t)\n${this.items.join('\n')}\n\t(sheet_instances\n\t\t(path "/"\n\t\t\t(page "1")\n\t\t)\n\t)\n\t(embedded_fonts no)\n)\n`;
    writeFileSync(path, text);
    let d = 0; for (const c of text) { if (c === '(') d++; else if (c === ')') d--; }
    if (d !== 0) throw new Error('unbalanced output: ' + d);
    return text.length;
  }
}
