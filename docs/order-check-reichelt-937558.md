# Order check: Reichelt order I-937558 (2026-11-16) against the schematic (2026-11-18)

Source: `hardware/order-reichelt-937558.pdf` (7 pages, subtotal 169.74 €, total 175.69 €). Compared with the parts
on the five sheets (198 symbols) and with `hardware/bom-order-list.csv`. Nothing in `bom.md` or the order list was changed.

## 1. Quantities: all fine

Every part on the sheets is in the order with enough pieces, for example MCP23017 2 of 2 needed, AQY212EH 12 of 7,
AQY210EH 6 of 2, PC817X1NSZ1B 15 of 7, 4.7 kΩ 15 of 8 (R107 included), 10 µF 15 of 7, 100 nF 60 of 23, SPTH 3 2-pole 10 of 5,
SPTH 1.5 3-pole 2 of 1, 4-pole 4 of 2, DIP-8 sockets 6 of 2, GS 28P-S sockets 2 of 2. The footprints were checked against
these parts (see `hardware/kicad/footprint-checklist.md`).

## 2. Mismatch: R207 (R_CAL1)

The design and the order list say **470 Ω 0.1 %**. The order has **SPR-0805 510 Ω 0.1 %** (5 pieces) and no 470 Ω 0.1 %.
Decision (D25): use the 510 Ω as R_CAL1. It is a self-test reference whose measured value goes into the firmware, so 470 or 510
makes no difference. The sheet value, the docs and the expected self-test value (510 Ω ± 3 %) were changed. R524 stays 470 Ω
(1 %, source impedance, ordered).

## 3. Missing: not in this order (and not in the order list either)

| Part | Needed | Note |
|---|---|---|
| **R210, 10 Ω 0805** | 1 | 3V3 to 3V3A filter (CH-R2 sheet). Not in the order list nor the order. Buy any 10 Ω 0805 (5 pieces). Until then a 0 Ω link or a wire in its place works (loses the filter, the analog parts still run). |

## 4. In the order list but not in this Reichelt order

Probably from another shop, or still to buy. None of these is on the PDF:

| Part | How many | Used for | Priority |
|---|---|---|---|
| IC socket, 6 pin (7.62 mm wide, 2.54 pitch) | 7 (+2 spare) | the 7 PC817 optocouplers (new footprint, D24 session) | needed to assemble |
| Female header 1×20, 2.54 mm | 2 | Pico sockets | needed |
| Female header 1×10 | 2 | ADS1115 modules JM1, JM2 | needed |
| Female header 1×3 | 2 | clamp modules JC1, JC2 | needed |
| Pin headers: one 2×20 strip covers J8 (2×8) and J10 (2×10), plus about 70 single pins (1×40 strips) | 1 + 2 | J8, J10, J9 (1×4), JP1 (1×3), JP21/JP22, test points, clamp modules | needed |
| Jumper (2.54 mm) | 2 | JP1, spare | needed |
| SOT-23 to DIP adapter boards | 2 (+2) | BAT54S clamp modules (JC1, JC2) | needed for the clamp |
| Tactile button 6 × 6 mm | 1 (+1) | SW301 reset | needed |
| ADS1115 breakout module | 2 (+1) | JM1 0x48, JM2 0x49 | needed: the resistance meter reads through JM1 |
| E-STOP push button, 2 NC contacts | 1 | SW2 | recommended; J21/J22 pins 3-4 can be jumpered until you have it |
| M3 standoffs and screws | 4 (+ 1 M3 screw per fuse holder) | board mounting, F1 centre hole | needed |
| Wire, heat shrink, ferrules | 1 set | wiring | needed |
| Test points (loop or pin) | 22 | TP1…TP22 (to be placed in the layout) | optional |

Everything in this table except the ADS1115 modules and the SOT-23 adapters is sold in any electronics shop, so the local shop
is a reasonable source. The 10 Ω 0805 resistor is the one item that is awkward locally.

## 5. Not needed any more

- The 10 MΩ and 10 nF parts, the BAT54HT1G diodes and the 1N5819 are for DNP positions (peak hold, VSYS): fine as spares.
- The isolated DC-DC module was not ordered and stays DNP (D22).
