#!/usr/bin/env node
// Usage: node tools/drawio/build.mjs tools/drawio/specs/<name>.mjs [--force]
// Writes hardware/diagrams/<name>.drawio.svg. It refuses to overwrite an existing diagram unless
// --force is given, because once a diagram exists the user may have edited it in draw.io.
import { existsSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from './drawio-svg.mjs';

const [specPath, flag] = process.argv.slice(2);
if (!specPath) { console.error('usage: build.mjs <spec.mjs> [--force]'); process.exit(2); }
const spec = (await import(pathToFileURL(resolve(specPath)).href)).default;
const out = resolve('hardware/diagrams', `${basename(specPath, '.mjs')}.drawio.svg`);
if (existsSync(out) && flag !== '--force') {
  console.error(`${out} exists (may contain draw.io edits). Use --force to overwrite.`);
  process.exit(1);
}
writeFileSync(out, build(spec));
console.log(`wrote ${out}`);
