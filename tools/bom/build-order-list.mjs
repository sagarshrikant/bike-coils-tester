#!/usr/bin/env node
// Builds hardware/bom-order-list.xlsx and hardware/bom-order-list.csv from tools/bom/order-list-data.mjs.
// Usage: node tools/bom/build-order-list.mjs
// Needs the exceljs package: `npm install exceljs` in tools/bom, or set EXCELJS_DIR to a folder that has it.
import { writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { HEADERS as BASE_HEADERS, ROWS } from './order-list-data.mjs';
import { VERIFY, GENERIC } from './order-list-verify.mjs';

let ExcelJS;
try { ExcelJS = (await import('exceljs')).default; }
catch {
  const dir = process.env.EXCELJS_DIR;
  if (!dir) { console.error('exceljs not found. Run `npm install exceljs` in tools/bom or set EXCELJS_DIR.'); process.exit(1); }
  ExcelJS = createRequire(resolve(dir) + '/')('exceljs');
}

// the "what it does / what to check" column goes just before the user's column
const HEADERS = [...BASE_HEADERS.slice(0, -1), 'What it does + what to check in the datasheet', BASE_HEADERS[BASE_HEADERS.length - 1]];
const verifyText = (item) => VERIFY[item] ?? (GENERIC.find(([re]) => re.test(item)) ?? [null, ''])[1];
// carry over the user's own column from hardware/bom-order-list-filled.xlsx (matched by block + item), so regenerating never loses it
const userByKey = new Map();
const userByRef = new Map(); // fallback when an item was renamed: block + refs, used only if that pair is unique
const filledPath = resolve('hardware/bom-order-list-filled.xlsx');
if (existsSync(filledPath)) {
  const wbF = new ExcelJS.Workbook();
  await wbF.xlsx.readFile(filledPath);
  const wsF = wbF.getWorksheet('Order list') ?? wbF.worksheets[0];
  const hdr = wsF.getRow(1).values; const cUser = hdr.findIndex((h) => String(h ?? '').startsWith('YOUR ENTRY')); const cBlock = hdr.findIndex((h) => h === 'Block'); const cItem = hdr.findIndex((h) => h === 'Item'); const cRef = hdr.findIndex((h) => String(h ?? '').startsWith('Ref'));
  wsF.eachRow((row, n) => { if (n === 1) return; const v = row.getCell(cUser).value; const text = (v && typeof v === 'object' && v.text) ? v.text : v; if (!text) return; userByKey.set(`${row.getCell(cBlock).value}|${row.getCell(cItem).value}`, v); const rk = `${row.getCell(cBlock).value}|${row.getCell(cRef).value}`; userByRef.set(rk, userByRef.has(rk) ? null : v); });
  console.log(`kept ${userByKey.size} entries from your filled sheet`);
}
const data = ROWS.map((r, i) => [i + 1, ...r, verifyText(r[2]), (userByKey.get(`${r[0]}|${r[2]}`) ?? (r[1] && r[1] !== 'passives' && r[1] !== '—' ? userByRef.get(`${r[0]}|${r[1]}`) : null)) ?? '']);
const COL_USER = HEADERS.length;                             // 1-based
const COL_MS = HEADERS.indexOf('Milestone') + 1;

// ---- CSV (semicolon-separated, for German Excel; UTF-8 with BOM)
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const csv = '﻿' + [HEADERS, ...data].map((row) => row.map(esc).join(';')).join('\r\n') + '\r\n';
writeFileSync(resolve('hardware/bom-order-list.csv'), csv);

// ---- XLSX
const wb = new ExcelJS.Workbook();
wb.creator = 'bike-coils-tester';
const ws = wb.addWorksheet('Order list', { views: [{ state: 'frozen', xSplit: 4, ySplit: 1 }] });
ws.addRow(HEADERS);
data.forEach((r) => ws.addRow(r));

const widths = [5, 7, 18, 34, 36, 28, 18, 9, 9, 11, 38, 32, 30, 13, 42, 70, 48];
widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
const thin = { style: 'thin', color: { argb: 'FFBFBFBF' } };
const border = { top: thin, left: thin, bottom: thin, right: thin };
ws.getRow(1).height = 48;
ws.getRow(1).eachCell((c, n) => {
  c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: n === COL_USER ? 'FF1F6FB2' : 'FF1F2937' } };
  c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  c.border = border;
});
const msFill = { 'M1': 'FFC6EFCE', 'M1 optional': 'FFFFEB9C', 'Later': 'FFD9D9D9', 'Have': 'FFDDEBF7', 'India': 'FFDDEBF7' };
for (let r = 2; r <= data.length + 1; r++) {
  const row = ws.getRow(r);
  row.alignment = { vertical: 'top', wrapText: true };
  row.eachCell({ includeEmpty: true }, (c, n) => {
    c.border = border;
    c.alignment = { vertical: 'top', wrapText: true };
    if (n === COL_USER) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF4FF' } };
  });
  const ms = row.getCell(COL_MS);
  ms.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: msFill[ms.value] ?? 'FFFFFFFF' } };
  ms.font = { bold: true };
  if (ms.value === 'Later') row.eachCell((c, n) => { if (n !== COL_MS && n !== COL_USER) c.font = { color: { argb: 'FF6B7280' } }; });
}
ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: data.length + 1, column: HEADERS.length } };
ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

// ---- legend sheet
const lg = wb.addWorksheet('Legend and how to use');
lg.getColumn(1).width = 22; lg.getColumn(2).width = 110;
const lines = [
  ['How to use', 'Filter the "Milestone" column, check each item at Reichelt, Farnell or Mouser, and write the result in the last (blue) column: in stock / not available, the real part number, and a link to the product page or datasheet. If you pick one of my alternatives, put its part number there.'],
  ['Part numbers', 'All suggested part numbers are from memory of the manufacturers\' catalogues. They are starting points: VERIFY every one (package, voltage rating, pinout, availability) before ordering. Items marked "check" are the ones I am least sure about.'],
  ['M1', 'Needed for Milestone-1: the end-of-November target (pickup coil testing, and CDI trigger simulation into an ignition coil, tested independently). Mount these before you travel.'],
  ['M1 optional', 'Recommended for Milestone-1 but the target can be reached without them (self-test parts, kill-input test, E-STOP, optional peak hold, fallback module). Fit them if you have the parts and the time.'],
  ['Later', 'Not needed for Milestone-1: footprints stay on the PCB, but the parts can wait (expansion header, isolated DC-DC, the 78L09 option).'],
  ['Have / India', 'Already owned, or already in India. Not on the PCB.'],
  ['Solder', 'Easy = through-hole. Medium = SOT-23, SOIC, SOP-4, 0805, DO-214. Hard = VSSOP-10 (0.5 mm pitch).'],
  ['Qty to order', 'Includes spares: about 1 extra for ICs, and packs for passives. For passives the "Qty on board" counts every use across the blocks.'],
  ['PCB', 'The bare PCB is ordered from JLCPCB, not from the parts suppliers. Gerbers come from KiCad (Thursday–Friday), order by Saturday 21 Nov with express shipping.'],
  ['Footprint check', 'Before the PCB order, make sure each footprint in KiCad matches the exact part you intend to buy (relay pin spacing, TO-92 regulators, terminal pitch, photoMOS, SOIC-16 mux).'],
];
lines.forEach(([a, b]) => { const r = lg.addRow([a, b]); r.getCell(1).font = { bold: true }; r.alignment = { vertical: 'top', wrapText: true }; });

// ---- summary sheet (live formulas)
const sm = wb.addWorksheet('Summary');
sm.getColumn(1).width = 26; [2, 3, 4, 5, 6, 7, 8].forEach((c) => { sm.getColumn(c).width = 12; });
const blocks = ['MB', 'R2', 'PU', 'ARM', 'TG', 'EXT'];
const msList = ['M1', 'M1 optional', 'Later', 'Have', 'India'];
sm.addRow(['Lines per block and milestone', ...msList, 'Total']);
sm.getRow(1).font = { bold: true };
const last = data.length + 1;
blocks.forEach((b, i) => {
  const r = i + 2;
  sm.addRow([b, ...msList.map((m, j) => ({ formula: `COUNTIFS('Order list'!$B$2:$B$${last},"${b}",'Order list'!$${String.fromCharCode(64 + COL_MS)}$2:$${String.fromCharCode(64 + COL_MS)}$${last},"${m}")` })),
    { formula: `SUM(B${r}:F${r})` }]);
});
const tr = blocks.length + 2;
sm.addRow(['Total', ...['B', 'C', 'D', 'E', 'F', 'G'].map((c) => ({ formula: `SUM(${c}2:${c}${tr - 1})` }))]);
sm.getRow(tr).font = { bold: true };
sm.addRow([]);
sm.addRow(['Items you have entered', { formula: `COUNTA('Order list'!$${String.fromCharCode(64 + COL_USER)}$2:$${String.fromCharCode(64 + COL_USER)}$${last})` }, 'of', data.length]);

await wb.xlsx.writeFile(resolve('hardware/bom-order-list.xlsx'));
const count = (m) => data.filter((r) => r[COL_MS - 1] === m).length;
console.log(`rows ${data.length}: M1 ${count('M1')}, M1 optional ${count('M1 optional')}, Later ${count('Later')}, Have ${count('Have')}, India ${count('India')}`);
console.log('wrote hardware/bom-order-list.xlsx and .csv');
