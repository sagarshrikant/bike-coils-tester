---
name: drawio-diagram
description: Create a new block or wiring diagram for this project as an editable .drawio.svg (opens in draw.io, renders as plain SVG). Use when the user asks for a new diagram, block diagram, wiring diagram or architecture picture.
---

# Creating a project diagram

Diagrams live in `hardware/diagrams/<name>.drawio.svg`. Each one is a normal SVG with the draw.io
model embedded in its `content` attribute, so it shows up on GitHub/browsers and opens for editing
in draw.io (desktop or app.diagrams.net → File → Open).

## New diagram

1. Write a spec in `tools/drawio/specs/<name>.mjs` (copy `ch-r2-resistance.mjs` for wiring,
   `system-block-diagram.mjs` for blocks). Format is documented at the top of
   `tools/drawio/drawio-svg.mjs`: `groups`, `nodes`, `edges` with absolute px coordinates;
   edges route orthogonally (`viaX` / `viaY` to steer them, `arrow: false` for plain wires).
2. Build: `node tools/drawio/build.mjs tools/drawio/specs/<name>.mjs`
3. **Check it visually.** Render to PNG in the scratchpad and look at it:
   `rsvg-convert hardware/diagrams/<name>.drawio.svg -o <scratchpad>/<name>.png`
   (install with `sudo apt-get install -y librsvg2-bin` if missing). Fix overlaps and crossing
   wires, and keep labels off the lines.
4. Link the diagram from the relevant doc (`docs/architecture.md` or `hardware/circuits/*.md`).

## Conventions

- Colours: green fill = current phase, orange = HV / hazardous, red wires = drive/HV,
  blue = signal/sense, black = ground, purple = network.
- Show physical Pico pin numbers next to GPIO names (e.g. `GP26 / ADC0 (pin 31)`).
- Every HV block carries an orange style. Note the voltage on the edges into and out of it.

## Changing an existing diagram

The `.drawio.svg` is the source of truth once it exists. The user may have edited it in draw.io.
**Don't rebuild it with `--force`** unless the user confirms they have no edits. Make small
changes by editing the SVG + embedded model carefully, or ask the user to edit it in draw.io.
