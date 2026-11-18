# PCB layout plan (mainboard)

Decisions are in `docs/decisions.md` D26. The board is made at a PCB house and assembled by hand; every part is through-hole or a
hand-solderable SMD (0805, SOIC, MSOP, SOT-23, SOT-89, SMA/SMB, 1812).

## Manufacturing choices (lowest cost)

| Item | Choice | Why |
|---|---|---|
| Layers | 2 | cheapest; the signals are slow, power is carried by wide tracks and pours |
| Thickness | 1.6 mm | standard, no surcharge |
| Copper | 1 oz outer | standard |
| Surface | lead-free HASL | cheapest finish, fine for hand soldering |
| Size | **150 × 125 mm** (was 130 × 100) | the part courtyards add up to about 7 800 mm²; on 130 × 100 mm the logic side would be 83 % full, too dense to route on 2 layers. 150 × 125 mm gives about 45 % fill |
| Outline | plain rectangle, 4 × M3 holes (3.2 mm) 4 mm in from the corners | no routing surcharge |
| Min track / clearance | 0.25 mm / 0.2 mm (default), vias 0.6 / 0.3 mm | well inside any house's limits |
| Copper to board edge | 0.3 mm or more | house minimum |

## Isolation slot (D26)

- Routed slot **2 mm wide**, copper pulled back **0.5 mm** on both sides: 3 mm copper to copper across the slot.
- The slot is **horizontal**, y = 67 to 69, x = 5 to 145 (round ends), and does **not** run edge to edge: **5 mm solid bridges** at the left and right edges keep the board in one piece. No copper on a bridge. (A vertical slot was tried first: the 13 straddling parts need about 100 mm along the slot.)
- **Logic side on top (y < 49), 12 V side at the bottom (y > 51).**
- Straddling parts (their two rows of pins sit on opposite sides of the slot): U101–U104 and U511–U513 (PC817 in 6-pin sockets, rows 7.62 mm apart), PR5–PR9 (AQY212EH, 7.62 mm), U506 (ADuM1250, pad gap 3.9 mm). The slot fits between their pads.
- Why 2 mm and not 3 mm: the ADuM1250 pad gap leaves only 0.45 mm per side with a 3 mm slot and 0.93 mm with 2 mm; the 3 mm
  copper-to-copper distance already covers the 2.5 mm that IPC-2221 asks for at 400 V; the voltage across the barrier in
  normal use is under 150 V. A wider slot gives nothing extra.
- Across the slot the surface path (creepage) goes around the slot ends, so it is long.

## Sides of the slot

| 12 V side (GND_P), bottom | logic side (GND_L), top |
|---|---|
| ARM stage: J1, F1, Q1, Q2, K1, Q3, C101, J3, J4, J21, J22, LEDs, R10x | Pico U1, expanders U2, U3, ADS modules JM1, JM2, J8, J10, SW301 |
| CH-TG: regulators U501–U505, U504 pump, U507–U509, U510, J5, JP1, J9 | CH-R2 (J6, JC1) and CH-PU (J7, JC2, PR1, PR2, PR3, PR4, U401–U404) |
| JP22 (GND_P pad) | JP21 (AGND pad) |

## Net classes (already in the project file)

| Class | Track / clearance | Nets |
|---|---|---|
| Power5A | 3.0 mm / 0.3 mm | 12V_IN, IN_FUSED, 12V_RAW, 12V_MID, 12V_ARMED (5 A fuse path; use a pour where possible) |
| Power2A | 1.5 mm / 0.3 mm | OUT1, OUT2 (2 A fuses) |
| PU_HV | 0.3 mm / **1.0 mm** | PU_IN, PU_MID, PR1_B, PR2_B (pickup input, clamped at 120 V) |
| PowerLogic | 0.5 mm / 0.25 mm | 3V3, 3V3A, 3V3_P, VSYS, 5V_RAW, +5V_P, +9V_P, −5V_P, MUX_VDD |
| Default | 0.25 mm / 0.2 mm | everything else |

## Ground and pours

- Bottom copper: GND_L pour on the logic side, GND_P pour on the 12 V side, never crossing the slot. AGND star at NT1.
- Keep the pickup input (PU_IN) and its divider away from the ADC lines; keep the 12 V side switching nodes (K1 coil, Q3, diode D102) away from the analog parts.
- Decoupling capacitors (100 nF) right next to each IC supply pin.

## Silkscreen to add

JP21/JP22: "CHAIN-B ONLY. Bridges isolation." J5: "Chain-B: unplug J5.1 (OUT)." Pin 1 of every connector and IC; pin labels on J8, J9 and J10; "12 V SIDE" and "LOGIC SIDE" on the two halves.

## Steps (in KiCad PCB editor)

1. Board setup and import the netlist (F8).
2. Board outline, M3 holes and the slot with its two bridges.
3. Place the 12 V side, then the logic side, then connectors on the edges.
4. Route the Power5A and Power2A nets first, then the rest; pours last.
5. DRC to zero errors, then silkscreen, then Gerbers and drill files.

## Slot-straddling parts, already placed in the PCB file (2026-11-18)

Centre x along the slot, centre y = 50. LED side of an optocoupler or photoMOS on the logic side (top), switch/transistor side on the 12 V side (bottom). U103 and U104 are the other way round (their LED is on the 12 V side).

| Part | Footprint | Centre x (mm) | Rotation |
|---|---|---|---|
| U101, U102 | PC817 in DIP-6 socket | 15, 24 | 270 |
| U103, U104 (LED on the 12 V side) | PC817 in DIP-6 socket | 33, 42 | 90 |
| U511, U512, U513 | PC817 in DIP-6 socket | 54, 63, 72 | 270 |
| PR5 to PR9 | DIP-4 | 83, 90, 97, 104, 111 | 270 |
| U506 (ADuM1250) | SOIC-8 | 120 (not placed: rotate 270 in KiCad, pins 1-4 on the top row) | 270 |

## Floorplan of the draft placement (2026-11-18)

Board coordinates: origin at the board's top-left corner, x to the right, y down, in mm. In KiCad add the board offset (15.1475, 15.4775).
Rotation of the Pico: 90 degrees, so the USB end is at the left board edge.

| Region | x (mm) | y (mm) | Contents |
|---|---|---|---|
| Logic, Pico | 3 to 57 | 3 to 26 | U1 (USB toward the left edge), SW301, R301 to R303, C301, C302 |
| Logic, expanders | 60 to 85 | 3 to 39 | U2, U3 and their pull resistors R310 to R326 packed around them |
| Logic, headers | 112 to 148 | 3 to 29 | J10, J8, JM1, JP21 (JM2 is on the 12 V side, x 138 to 142, y 85 to 112) |
| Logic, CH-R2 | 3 to 31 | 30 to 55 | JC1, PR3, PR4, J6 and the R200 / C200 parts around them |
| Logic, CH-PU | 88 to 139 | 31 to 58 | U401 to U404, PR1, PR2, J7, JC2 and the R400 / C400 parts |
| LED resistors | 64 to 130 | about 59 | R516, R518, R520, R523, R525, R527, R529, R531, C511 above the straddling parts |
| Slot band | 5 to 145 | 57 to 79 (slot 67 to 69) | U101 to U104, U511 to U513, PR5 to PR9, U506 |
| Power, CH-TG | 3 to 59 | 77 to 104 | U501 to U505, U507 to U510, JP1, J9, JP22 and the R500 / C500 parts |
| Power, ARM | 62 to 137 | 77 to 110 | F1, K1, C101, Q1, Q2 and the R100 parts, diodes, LEDs, Q3, F2, F3 |
| Terminal row | from x = 5 | about 111 to 122 | J1, J3, J4, J5, J21, J22 along the bottom edge |
| Mounting holes | 4 and 146 | 4 and 121 | H1 to H4 |

This is a draft made by a script from the part sizes: the passives sit in the free space nearest to their group, with no overlap
and every part inside the board. It is not optimised for wiring. Refine it by hand in this order:
1. Connectors: check which way each terminal's wire entry faces (it must face the board edge); rotate if not.
2. Straddling parts: pin 1 marks (LED side toward the logic side, except U103 and U104).
3. Decoupling capacitors right next to the supply pin of each IC.
4. Analog part of CH-PU and CH-R2 (keep it away from the 12 V side and the Pico).
5. The 12 V power path (F1, Q1, Q2, K1, F2, F3) in a short, wide line.
