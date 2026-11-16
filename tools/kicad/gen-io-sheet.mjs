#!/usr/bin/env node
// Generates hardware/kicad/mainboard/mainboard-io.kicad_sch: a stand-alone schematic sheet with the Pico,
// the two MCP23017 expanders and the two ADS1115 module headers, every pin already carrying its global net label.
// Symbols are copied from the user's own mainboard.kicad_sch (same library version), which is never modified.
// Usage: node tools/kicad/gen-io-sheet.mjs
// Net names come from docs/pin-budget.md and hardware/circuits/mainboard.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const SRC = 'hardware/kicad/mainboard/mainboard.kicad_sch';
const OUT = 'hardware/kicad/mainboard/mainboard-io.kicad_sch';
const src = readFileSync(SRC, 'utf8');

function extractSymbol(libId) {
  const start = src.indexOf(`\t\t(symbol "${libId}"`);
  if (start < 0) throw new Error('symbol not found in ' + SRC + ': ' + libId);
  let depth = 0, i = start;
  for (; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')') { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}

function parsePins(block) {
  const pins = new Map();
  const re = /\(pin (\w+) (\w+)\s*\(at ([-\d.]+) ([-\d.]+) (\d+)\)\s*\(length ([\d.]+)\)(?:\s*\(hide yes\))?\s*\(name "([^"]*)"[\s\S]*?\(number "([^"]*)"/g;
  for (const m of block.matchAll(re)) {
    if (!pins.has(m[8])) pins.set(m[8], { x: +m[3], y: +m[4], a: +m[5], name: m[7], num: m[8] });
  }
  return pins;
}

// Conn_01x10 (not in the user's file yet): same drawing style as Conn_01x20_Pin
function conn10() {
  const pins = [];
  for (let i = 0; i < 10; i++) {
    pins.push(`\t\t\t\t(pin passive line\n\t\t\t\t\t(at 5.08 ${(10.16 - 2.54 * i).toFixed(2)} 180)\n\t\t\t\t\t(length 3.81)\n\t\t\t\t\t(name "Pin_${i + 1}"\n\t\t\t\t\t\t(effects (font (size 1.27 1.27)))\n\t\t\t\t\t)\n\t\t\t\t\t(number "${i + 1}"\n\t\t\t\t\t\t(effects (font (size 1.27 1.27)))\n\t\t\t\t\t)\n\t\t\t\t)`);
  }
  return `\t\t(symbol "Connector:Conn_01x10_Pin"
\t\t\t(exclude_from_sim no)
\t\t\t(in_bom yes)
\t\t\t(on_board yes)
\t\t\t(in_pos_files yes)
\t\t\t(duplicate_pin_numbers_are_jumpers no)
\t\t\t(property "Reference" "J" (at 0 15.24 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27))))
\t\t\t(property "Value" "Conn_01x10_Pin" (at 0 -15.24 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27))))
\t\t\t(property "Footprint" "" (at 0 0 0) (hide yes) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27))))
\t\t\t(property "Datasheet" "~" (at 0 0 0) (hide yes) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27))))
\t\t\t(property "Description" "Generic connector, single row, 01x10" (at 0 0 0) (hide yes) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27))))
\t\t\t(symbol "Conn_01x10_Pin_1_1"
\t\t\t\t(rectangle (start 0 11.43) (end 0.635 -13.97) (stroke (width 0.1524) (type default)) (fill (type outline)))
${pins.join('\n')}
\t\t\t)
\t\t\t(embedded_fonts no)
\t\t)`;
}

const picoSym = extractSymbol('MCU_Module:RaspberryPi_Pico_W');
const mcpSym = extractSymbol('Interface_Expansion:MCP23017x-x-SO');
const picoPins = parsePins(picoSym);
const mcpPins = parsePins(mcpSym);
const conn10Pins = new Map(Array.from({ length: 10 }, (_, i) => [String(i + 1), { x: 5.08, y: 10.16 - 2.54 * i, a: 180, name: `Pin_${i + 1}`, num: String(i + 1) }]));

// ---- net maps (pin number -> net)
const GND_L = 'GND_L';
const pico = {
  1: 'RLY_EN', 2: 'GP1_SPARE', 3: GND_L, 4: 'PU_POS', 5: 'PU_NEG', 6: 'SDA', 7: 'SCL', 8: GND_L, 9: 'TG_PULSE_A', 10: 'TG_PULSE_B',
  11: 'HV_CMP', 12: 'SP_IN', 13: GND_L, 14: 'RIG_PWM', 15: 'RIG_TACH', 16: 'DRV_OUT', 17: 'ARM_SENSE', 18: GND_L, 19: 'R2_DRIVE_1K',
  20: 'R2_DRIVE_10K', 21: 'GP16_SPARE', 22: 'PU_DAC_CS', 23: GND_L, 24: 'SPI0_SCK', 25: 'SPI0_MOSI', 26: 'EXP_RESET', 27: 'EXP_INT',
  28: GND_L, 29: 'PWR_EN', 30: 'RUN', 31: 'PU_SIG', 32: 'PU_PKP', 33: 'AGND', 34: 'PU_PKN', 36: '3V3', 38: GND_L, 39: 'VSYS', 40: 'VBUS',
};
// MCP23017 pins: 1-8 GPB0-7, 9 VDD, 10 VSS, 12 SCL, 13 SDA, 15-17 A0-A2, 18 RESET, 19 INTB, 20 INTA, 21-28 GPA0-7
const mcp = (a, b, a0, intaNet) => {
  const m = { 9: '3V3', 10: GND_L, 12: 'SCL', 13: 'SDA', 15: a0 ? '3V3' : GND_L, 16: GND_L, 17: GND_L, 18: 'EXP_RESET' };
  if (intaNet) m[20] = intaNet;
  a.forEach((n, i) => { if (n) m[21 + i] = n; });
  b.forEach((n, i) => { if (n) m[1 + i] = n; });
  return m;
};
const exp1 = mcp(['PU_RANGE5', 'PU_RANGE20', 'PU_RANGE100', 'PU_LOAD1', 'PU_LOAD2', 'PU_TEST', 'PU_PKRST_P', 'PU_PKRST_N'],
  [null, null, null, null, 'TG_IMP0', 'TG_IMP1', 'TG_IMP2', 'TG_EN'], false, 'EXP_INT');
const exp2 = mcp(['R4_EN', 'INS_EN', 'HV_RANGE0', 'HV_RANGE1', 'HV_PKRST', 'MID_SENSE', 'R2_CAL1', 'R2_CAL2'],
  ['KILL_GND', 'KILL_HI', null, null, null, null, null, null], true, null);
// ADS1115 module header pin order (user confirmed): 1 VDD, 2 GND, 3 SCL, 4 SDA, 5 ADDR, 6 ALRT, 7 A0, 8 A1, 9 A2, 10 A3
const jm1 = { 1: '3V3A', 2: 'AGND', 3: 'SCL', 4: 'SDA', 5: GND_L, 6: 'ADS1_ALRT', 7: 'V_NODE', 8: 'V_TOP1K', 9: 'V_TOP10K', 10: 'ADS1_A3_SPARE' };
const jm2 = { 1: '3V3_P', 2: 'GND_P', 3: 'SCL_P', 4: 'SDA_P', 5: '3V3_P', 6: 'ADS2_ALRT', 7: 'V_OUT_M', 8: 'V_AMPP_M', 9: 'V_AMPN_M', 10: 'V_ARM_M' };

// ---- emit
const uuid = () => randomUUID();
const ROOT = uuid();
const out = [];
const f = (s) => out.push(s);
const font = (sz = 1.27) => `(effects (font (size ${sz} ${sz})))`;

function placeSymbol(libId, ref, value, footprint, x, y, pinsMap) {
  const pinUuids = Array.from(pinsMap.keys()).map((n) => `\t\t(pin "${n}"\n\t\t\t(uuid "${uuid()}")\n\t\t)`).join('\n');
  f(`\t(symbol
\t\t(lib_id "${libId}")
\t\t(at ${x} ${y} 0)
\t\t(unit 1)
\t\t(body_style 1)
\t\t(exclude_from_sim no)
\t\t(in_bom yes)
\t\t(on_board yes)
\t\t(in_pos_files yes)
\t\t(dnp no)
\t\t(uuid "${uuid()}")
\t\t(property "Reference" "${ref}" (at ${x} ${y - 4} 0) (show_name no) (do_not_autoplace no) ${font()})
\t\t(property "Value" "${value}" (at ${x} ${y - 1.5} 0) (show_name no) (do_not_autoplace no) ${font()})
\t\t(property "Footprint" "${footprint}" (at ${x} ${y} 0) (hide yes) (show_name no) (do_not_autoplace no) ${font()})
\t\t(property "Datasheet" "" (at ${x} ${y} 0) (hide yes) (show_name no) (do_not_autoplace no) ${font()})
${pinUuids}
		(instances
			(project "mainboard"
				(path "/${ROOT}"
					(reference "${ref}")
					(unit 1)
				)
			)
		)
\t)`);
}
const r = (n) => Math.round(n * 100) / 100;
function labels(x, y, pinsMap, netMap) {
  for (const [num, net] of Object.entries(netMap)) {
    const p = pinsMap.get(String(num));
    if (!p) { console.warn(`no pin ${num} on symbol at ${x},${y}`); continue; }
    const lx = r(x + p.x), ly = r(y - p.y);
    // pin angle: 0 = pin on the left of the body (points right), 180 = right side, 90 = bottom, 270 = top
    const la = { 0: 180, 180: 0, 90: 270, 270: 90 }[p.a];
    const just = la === 180 ? 'right' : 'left';
    f(`\t(global_label "${net}"
\t\t(shape bidirectional)
\t\t(at ${lx} ${ly} ${la})
\t\t(effects (font (size 1.27 1.27)) (justify ${just}))
\t\t(uuid "${uuid()}")
\t\t(property "Intersheetrefs" "\${INTERSHEET_REFS}" (at ${lx} ${ly} 0) (show_name no) (do_not_autoplace no) (hide yes) ${font()})
\t)`);
  }
}
function note(x, y, text, sz = 1.27) {
  f(`\t(text "${text.replace(/"/g, "'")}"\n\t\t(exclude_from_sim no)\n\t\t(at ${x} ${y} 0)\n\t\t(effects (font (size ${sz} ${sz})) (justify left top))\n\t\t(uuid "${uuid()}")\n\t)`);
}

f(`(kicad_sch
\t(version 20260306)
\t(generator "eeschema")
\t(generator_version "10.0")
\t(uuid "${ROOT}")
\t(paper "A3")
\t(lib_symbols`);
f(picoSym); f(mcpSym); f(conn10());
f('\t)');

const PX = 90, PY = 120, E1X = 200, E1Y = 120, E2X = 290, E2Y = 120, J1X = 90, J1Y = 215, J2X = 200, J2Y = 215;
placeSymbol('MCU_Module:RaspberryPi_Pico_W', 'U1', 'Raspberry Pi Pico 2 W', 'Module:RaspberryPi_Pico_Common_THT', PX, PY, picoPins);
placeSymbol('Interface_Expansion:MCP23017x-x-SO', 'U2', 'MCP23017-E/SP (EXP1, 0x20)', 'Package_DIP:DIP-28_W7.62mm', E1X, E1Y, mcpPins);
placeSymbol('Interface_Expansion:MCP23017x-x-SO', 'U3', 'MCP23017-E/SP (EXP2, 0x21)', 'Package_DIP:DIP-28_W7.62mm', E2X, E2Y, mcpPins);
placeSymbol('Connector:Conn_01x10_Pin', 'JM1', 'ADS1115 module 0x48 (logic side)', 'Connector_PinSocket_2.54mm:PinSocket_1x10_P2.54mm_Vertical', J1X, J1Y, conn10Pins);
placeSymbol('Connector:Conn_01x10_Pin', 'JM2', 'ADS1115 module 0x49 (12 V side)', 'Connector_PinSocket_2.54mm:PinSocket_1x10_P2.54mm_Vertical', J2X, J2Y, conn10Pins);
labels(PX, PY, picoPins, pico);
labels(E1X, E1Y, mcpPins, exp1);
labels(E2X, E2Y, mcpPins, exp2);
labels(J1X, J1Y, conn10Pins, jm1);
labels(J2X, J2Y, conn10Pins, jm2);

note(20, 15, 'Mainboard I/O sheet (generated): Pico, expanders, ADS1115 modules', 2.54);
note(20, 24, 'Every pin has its net as a global label (from docs/pin-budget.md). Generated by tools/kicad/gen-io-sheet.mjs. Do not edit the labels by hand: change the pin map, then regenerate.');
note(20, 30, 'Open this file in KiCad, or use Place > Add sheet and pick it. Same global labels connect to the rest of your mainboard schematic.');
note(20, 36, 'Still to add (see hardware/circuits/mainboard.md): 4.7 k pull-ups on SDA/SCL, 10 k pull-up on EXP_RESET, 100 nF at each IC supply, 10 k pull-ups/-downs on the expander outputs.');
note(E1X - 20, E1Y + 40, 'U2 = EXP1 (0x20): A0-A2 to GND_L. INTA to EXP_INT. Spare: B0-B3.');
note(E2X - 20, E2Y + 40, 'U3 = EXP2 (0x21): A0 to 3V3, A1-A2 to GND_L. Spare: B2-B7.');
note(J1X - 15, J1Y + 20, 'JM1: pin order VDD, GND, SCL, SDA, ADDR, ALRT, A0, A1, A2, A3 (confirmed)');
note(J2X - 15, J2Y + 20, 'JM2 on the 12 V side (3V3_P / GND_P). ADDR to 3V3_P gives 0x49.');

f(`\t(sheet_instances\n\t\t(path "/"\n\t\t\t(page "1")\n\t\t)\n\t)\n\t(embedded_fonts no)\n)`);
writeFileSync(OUT, out.join('\n') + '\n');
console.log(`wrote ${OUT}: ${out.length} blocks; pico pins ${picoPins.size}, mcp pins ${mcpPins.size}`);
