#!/usr/bin/env node
// Net / pin consistency checks for the mainboard design.
// Usage: node tools/checks/net-check.mjs            (from the repo root)
//        KICAD_LIBS=~/kicad-libs node tools/checks/net-check.mjs   (also checks the KiCad symbols)
// Exit code 1 if any check FAILs. The golden maps below are the reviewed pin assignment (docs/pin-budget.md).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

// ---------------------------------------------------------------- golden maps
const GP = {
  0: 'RLY_EN', 1: null, 2: 'PU_POS', 3: 'PU_NEG', 4: 'SDA', 5: 'SCL', 6: 'TG_PULSE_A', 7: 'TG_PULSE_B', 8: 'HV_CMP', 9: 'SP_IN',
  10: 'RIG_PWM', 11: 'RIG_TACH', 12: 'DRV_OUT', 13: 'ARM_SENSE', 14: 'R2_DRIVE_1K', 15: 'R2_DRIVE_10K', 16: null, 17: 'PU_DAC_CS',
  18: 'SPI0_SCK', 19: 'SPI0_MOSI', 20: 'EXP_RESET', 21: 'EXP_INT', 22: 'PWR_EN', 26: 'PU_SIG', 27: 'PU_PKP', 28: 'PU_PKN',
};
// aliases: how pin-budget.md words a net that has a different literal name
const ALIAS = { PU_DAC_CS: ['CS'], SPI0_SCK: ['SCK'], SPI0_MOSI: ['MOSI'] };
const EXP = {
  'EXP1.A0': 'PU_RANGE5', 'EXP1.A1': 'PU_RANGE20', 'EXP1.A2': 'PU_RANGE100', 'EXP1.A3': 'PU_LOAD1', 'EXP1.A4': 'PU_LOAD2',
  'EXP1.A5': 'PU_TEST', 'EXP1.A6': 'PU_PKRST_P', 'EXP1.A7': 'PU_PKRST_N',
  'EXP1.B4': 'TG_IMP0', 'EXP1.B5': 'TG_IMP1', 'EXP1.B6': 'TG_IMP2', 'EXP1.B7': 'TG_EN',
  'EXP2.A0': 'R4_EN', 'EXP2.A1': 'INS_EN', 'EXP2.A2': 'HV_RANGE0', 'EXP2.A3': 'HV_RANGE1', 'EXP2.A4': 'HV_PKRST',
  'EXP2.A5': 'MID_SENSE', 'EXP2.A6': 'R2_CAL1', 'EXP2.A7': 'R2_CAL2', 'EXP2.B0': 'KILL_GND', 'EXP2.B1': 'KILL_HI',
};
// nets that are only used by blocks designed later (J8 expansion): allowed to be missing from the block docs
const LATER = new Set(['HV_CMP', 'SP_IN', 'RIG_PWM', 'RIG_TACH', 'DRV_OUT', 'R4_EN', 'INS_EN', 'HV_RANGE0', 'HV_RANGE1', 'HV_PKRST', 'EXP_INT']);

// ---------------------------------------------------------------- helpers
let fails = 0, warns = 0, passes = 0;
const pass = (m) => { passes++; console.log(`PASS  ${m}`); };
const fail = (m) => { fails++; console.log(`FAIL  ${m}`); };
const warn = (m) => { warns++; console.log(`WARN  ${m}`); };
const info = (m) => console.log(`INFO  ${m}`);
const norm = (s) => String(s).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
// does line l mention the net, also as a range (TG_IMP0–2) or list (HV_RANGE0, 1)?
const mentions = (l, net) => {
  if (norm(l).includes(norm(net))) return true;
  const m = net.match(/^(.*?)(\d)$/);
  if (!m) return false;
  const [, base, d] = m;
  const range = l.match(new RegExp(`${base}(\\d)[–-](\\d)`));
  if (range && +d >= +range[1] && +d <= +range[2]) return true;
  const list = l.match(new RegExp(`${base}(\\d)((?:,\\s*\\d)+)`));
  if (list && [+list[1], ...[...list[2].matchAll(/\d/g)].map((x) => +x[0])].includes(+d)) return true;
  return false;
};
const read = (f) => readFileSync(f, 'utf8');

const files = [
  'docs/pin-budget.md', 'docs/architecture.md',
  ...readdirSync('hardware/circuits').filter((f) => f.endsWith('.md')).map((f) => `hardware/circuits/${f}`),
  ...readdirSync('tools/drawio').filter((f) => f.startsWith('build-') && f.endsWith('.mjs')).map((f) => `tools/drawio/${f}`),
];
const text = Object.fromEntries(files.map((f) => [f, read(f)]));
const lines = (f) => text[f].split('\n');

// ---------------------------------------------------------------- 1. Pico pin table in mainboard.md vs golden
console.log('\n== 1. Pico pin table (hardware/circuits/mainboard.md) against the golden GPIO map');
const picoRows = {};
for (const l of lines('hardware/circuits/mainboard.md')) {
  const m = l.match(/^\|\s*(\d+)\s*\|\s*(GP\d+)(?:\s*\/\s*ADC\d)?\s*\|\s*([^|]*?)\s*\|/);
  if (m) picoRows[+m[1]] = { gp: +m[2].slice(2), net: m[3] };
}
const physical = [1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 19, 20, 21, 22, 24, 25, 26, 27, 29, 31, 32, 34];
const gpOfPin = Object.fromEntries(physical.map((p, i) => [p, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 26, 27, 28][i]]));
let ok1 = true;
for (const [pin, gp] of Object.entries(gpOfPin)) {
  const row = picoRows[pin];
  if (!row) { fail(`pin ${pin} (GP${gp}) is missing from the mainboard.md table`); ok1 = false; continue; }
  if (row.gp !== gp) { fail(`pin ${pin}: mainboard.md says GP${row.gp}, expected GP${gp}`); ok1 = false; }
  const want = GP[gp];
  if (want && norm(row.net) !== norm(want)) { fail(`GP${gp}: mainboard.md net "${row.net}", golden "${want}"`); ok1 = false; }
  if (!want && !/spare/i.test(row.net)) { fail(`GP${gp}: expected spare, mainboard.md says "${row.net}"`); ok1 = false; }
}
if (ok1) pass(`all ${physical.length} GPIO pins in mainboard.md match the golden map and the Pico pin numbering`);

// ---------------------------------------------------------------- 2. pin-budget.md vs golden
console.log('\n== 2. docs/pin-budget.md against the golden map');
let ok2 = true;
const pb = lines('docs/pin-budget.md');
for (const [gp, net] of Object.entries(GP)) {
  if (!net) continue;
  const hit = pb.find((l) => new RegExp(`\\bGP${gp}\\b`).test(l.split('|')[1] ?? '') && (norm(l).includes(norm(net)) || (ALIAS[net] ?? []).some((a) => l.includes(a))));
  if (!hit) { fail(`pin-budget.md has no row for GP${gp} with ${net}`); ok2 = false; }
}
for (const [line, net] of Object.entries(EXP)) {
  const [exp, bit] = line.split('.');
  const hit = pb.find((l) => l.includes(`${exp}.`) && new RegExp(`${exp}\\.[AB][0-9]`).test(l) && mentions(l, net) && coversBit(l, exp, bit));
  if (!hit) { fail(`pin-budget.md has no row for ${line} = ${net}`); ok2 = false; }
}
function coversBit(l, exp, bit) {
  const cell = (l.split('|')[1] ?? '').trim();
  if (!cell.startsWith(exp)) return false;
  const port = bit[0], n = +bit.slice(1);
  const range = cell.match(new RegExp(`${exp}\\.${port}(\\d)[–-]${port}?(\\d)`));
  if (range) return n >= +range[1] && n <= +range[2];
  const list = [...cell.matchAll(new RegExp(`(?:${exp}\\.)?${port}(\\d)`, 'g'))].map((m) => +m[1]);
  return list.includes(n);
}
if (ok2) pass('every golden GPIO and expander line appears in pin-budget.md');

// ---------------------------------------------------------------- 3. cross-references in all other files
console.log('\n== 3. every GPn / EXPn.xy reference in the block docs and diagram scripts agrees with the golden map');
let ok3 = true, refs = 0;
const gpNames = Object.entries(GP).filter(([, n]) => n).map(([g, n]) => [n, +g]);
for (const f of files) {
  if (f === 'docs/pin-budget.md' || f === 'hardware/circuits/mainboard.md' || f === 'tools/drawio/build-mainboard-schematic.mjs') continue;
  lines(f).forEach((l, i) => {
    const gps = [...l.matchAll(/\bGP(\d+)\b/g)].map((m) => +m[1]);
    if (!gps.length) return;
    for (const [net, gp] of gpNames) {
      const re = new RegExp(`(^|[^A-Z0-9_])${net}(?![A-Z0-9_])`, 'g');
      let mm;
      while ((mm = re.exec(l))) {
        const pos = mm.index + mm[1].length;
        const near = [...l.matchAll(/\bGP(\d+)\b/g)].filter((g) => Math.abs(g.index - pos) <= 28).map((g) => +g[1]);
        if (!near.length) continue;
        refs++;
        if (!near.includes(gp)) { fail(`${f}:${i + 1} ${net} is written next to GP${near.join(', GP')}, but ${net} is GP${gp}`); ok3 = false; }
      }
    }
  });
  lines(f).forEach((l, i) => {
    for (const m of l.matchAll(/\bEXP([12])\.([AB])(\d)\b/g)) {
      const key = `EXP${m[1]}.${m[2]}${m[3]}`;
      const want = EXP[key];
      refs++;
      if (want === undefined) {
        if (!/spare/i.test(l)) { fail(`${f}:${i + 1} refers to ${key}, which is not in the golden expander map`); ok3 = false; }
        continue;
      }
      const named = Object.entries(EXP).filter(([k, n]) => k !== key && new RegExp(`(^|[^A-Z0-9_])${n}([^A-Z0-9_]|$)`).test(l));
      if (named.length && !new RegExp(`(^|[^A-Z0-9_])${want}([^A-Z0-9_]|$)`).test(l) && !l.includes(want)) { fail(`${f}:${i + 1} ${key} appears next to ${named[0][1]}, but ${key} is ${want}`); ok3 = false; }
    }
  });
}
if (ok3) pass(`${refs} net/pin references checked in ${files.length - 3} files, no disagreement`);

// ---------------------------------------------------------------- 4. unique assignments
console.log('\n== 4. uniqueness and coverage');
const used = Object.values(GP).filter(Boolean);
if (new Set(used).size === used.length) pass('no net name is assigned to two GPIOs'); else fail('a net name appears on two GPIOs');
const eused = Object.values(EXP);
if (new Set(eused).size === eused.length) pass('no net name is assigned to two expander lines'); else fail('a net name appears on two expander lines');
const blockText = files.filter((f) => /hardware\/circuits\/(ch-|power)/.test(f) || /build-(ch-|power)/.test(f)).map((f) => text[f]).join('\n');
const orphans = [...used, ...eused].filter((n) => !LATER.has(n) && !new RegExp(`(^|[^A-Z0-9_])${n}([^A-Z0-9_]|$)`).test(blockText) && !['SDA', 'SCL', 'SPI0_SCK', 'SPI0_MOSI', 'PU_DAC_CS', 'EXP_RESET'].includes(n));
if (orphans.length) warn(`nets on the Pico/expanders that no block doc or block diagram mentions: ${orphans.join(', ')}`); else pass('every net that is not marked "later" appears in a block doc or diagram');
const spareGp = Object.entries(GP).filter(([, n]) => !n).map(([g]) => `GP${g}`);
info(`spare GPIO: ${spareGp.join(', ')}; free GPIO budget: GP0–22 and GP26–28 = 26, used ${used.length}`);
info(`expander lines used: ${eused.length} of 32 (MID_SENSE is an input)`);

// ---------------------------------------------------------------- 5. KiCad symbols (optional)
console.log('\n== 5. KiCad symbol pin numbers against our tables');
const libs = process.env.KICAD_LIBS ?? join(homedir(), 'kicad-libs');
const sym = (lib, name) => join(libs, 'kicad-symbols', `${lib}.kicad_symdir`, `${name}.kicad_sym`);
const pinsOf = (file) => {
  const t = read(file); const out = {};
  const re = /\(pin\s+\w+\s+\w+\s*\(at[^)]*\)\s*\(length[^)]*\)\s*(?:\(hide yes\)\s*)?\(name\s+"([^"]*)"[^)]*\)[\s\S]*?\(number\s+"([^"]*)"/g;
  let m; while ((m = re.exec(t))) out[m[2]] = m[1];
  return out;
};
const picoFile = sym('MCU_Module', 'RaspberryPi_Pico'), mcpFile = sym('Interface_Expansion', 'MCP23017x-x-SO');
if (!existsSync(picoFile) || !existsSync(mcpFile)) {
  warn(`KiCad symbol libraries not found in ${libs}: symbol check skipped (set KICAD_LIBS)`);
} else {
  const pins = pinsOf(picoFile);
  let ok5 = true;
  for (const [pin, row] of Object.entries(picoRows)) {
    const name = pins[pin] ?? '(missing)';
    const m = name.match(/^GPIO(\d+)/);
    if (!m || +m[1] !== row.gp) { fail(`Pico symbol pin ${pin} is "${name}", our table says GP${row.gp}`); ok5 = false; }
  }
  const special = { 30: 'RUN', 33: 'AGND', 35: 'ADC_VREF', 36: '3V3', 37: '3V3_EN', 39: 'VSYS', 40: 'VBUS' };
  for (const [pin, n] of Object.entries(special)) if (pins[pin] !== n) { fail(`Pico symbol pin ${pin} is "${pins[pin]}", expected ${n}`); ok5 = false; }
  for (const g of [3, 8, 13, 18, 23, 28, 38]) if (pins[g] !== 'GND') { fail(`Pico symbol pin ${g} is "${pins[g]}", expected GND`); ok5 = false; }
  if (ok5) pass('Pico symbol (RaspberryPi_Pico, also used by RaspberryPi_Pico_W): all 40 pins match mainboard.md');
  const mp = pinsOf(mcpFile);
  const want = { 9: 'VDD', 10: 'VSS', 12: 'SCL', 13: 'SDA', 15: 'A0', 16: 'A1', 17: 'A2', 18: 'RESET', 19: 'INTB', 20: 'INTA' };
  for (let i = 0; i < 8; i++) { want[1 + i] = `GPB${i}`; want[21 + i] = `GPA${i}`; }
  let ok6 = true;
  for (const [pin, n] of Object.entries(want)) {
    const got = (mp[pin] ?? '').replace(/[{}~_^]/g, '').replace('SCK', 'SCL');
    if (got !== n) { fail(`MCP23017 symbol pin ${pin} is "${mp[pin]}", our table says ${n}`); ok6 = false; }
  }
  if (ok6) pass('MCP23017 symbol: all 26 used pins match the pin numbers in mainboard.md');
}

console.log(`\n${passes} passed, ${warns} warnings, ${fails} failed`);
process.exit(fails ? 1 : 0);
