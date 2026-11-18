# Routing progress (read this first when resuming)

**RESUME HERE: next task = step 1 of the 10-step order (join the two 12V_RAW groups) (last updated 2026-11-18, nothing routed yet)

How we work: one small task at a time. The user routes in KiCad (PCB editor, `hardware/kicad/mainboard/mainboard.kicad_pcb`), saves,
says "T<n> done". Claude then checks the file with `node tools/pcb/netcheck.js hardware/kicad/mainboard/mainboard.kicad_pcb <NET>`
(shows ROUTED or OPEN with the pieces that are still separate; `--pads <NET>` prints pad coordinates; `--all` lists every net),
updates this file, commits, and gives the next task. DRC is the final judge. Claude never edits the PCB file while KiCad is open.

Rules for all tasks: power nets on **F.Cu** (top) with the width from the net class (Power5A 3 mm, Power2A 1.5 mm, PowerLogic 0.5 mm,
default 0.25 mm); the bottom layer (B.Cu) is kept for the ground pours (milestone M2); nothing crosses the slot; vias 0.6 / 0.3 mm.

## Milestones (Claude's overview)

| M | Goal | Status |
|---|---|---|
| M0 | Preparation: DRC run, router settings | done |
| M1 | 12 V power path (J1 to the outputs) | open |
| M2 | Ground pours GND_P, GND_L; AGND star | open |
| M3 | Supply rails (3V3, 3V3A, 3V3_P, VSYS, ±5 V, 9 V, MUX_VDD) | open |
| M4 | ARM stage signals (gate chain, relay, senses) | open |
| M5 | CH-TG (trigger generator) | open |
| M6 | CH-R2 (resistance) | open |
| M7 | CH-PU (pickup) | open |
| M8 | I/O sheet: Pico, expanders, headers J8, J9, J10 | open |
| M9 | Cleanup: DRC to zero, silkscreen, Gerbers | open |

Tasks of later milestones are written when we reach them (the part positions may still change).

## M0 Preparation

- [x] **T0.1** Reopen the project, run DRC (Inspect, Design Rules Checker, Run), save the report as `DRC.rpt`. Expected: only "unconnected items". Tell Claude the counts by type.
- [x] **T0.2** Router settings (already set).
- [x] **T0.3** Reopen the project and look at the power area (lower right, board bottom edge). Claude placed the 12 V chain by hand-designed coordinates and an optimiser: terminals J1, J3, J4 on the bottom edge, F1 standing upright above J1, Q1 and Q2 standing upright to its right, K1 top right, F2, F3, D102 and C101 below and beside K1. Chain length 349 mm to about 100 mm. If it looks wrong, Claude undoes it (`git revert` of the commit "12 V chain placed").

## M1 12 V power path (all on F.Cu, 3 mm unless stated)

- [x] **T1.1** `12V_IN`: J1 pin 1 (x 95.15, y 132.38) straight up to F1 pad 1 (x 95.15, y 122.13), 10 mm, 3 mm wide, on F.Cu.
- [x] **T1.2** `IN_FUSED`: F1 pad 2 (95.15, 99.63) to Q1 pin 2 (105.15, 100.23). The TO-220 pins are only 2.54 mm apart, so a 3 mm track cannot end on one pin: use 1.5 mm for the last 3 mm at the pin (press **W** while routing to change the width), or draw the net as a zone later.
- [x] **T1.3** `12V_RAW`, trunk part 1: Q1 pin 3 (104.50, 96.96) to Q2 pin 3 (116.75, 97.29). 1.5 mm for the first 2 mm (to x 106.5) and the last 2 mm (from x 114.5), 3 mm in between. (done: user routed it 2 mm wide as a loop over the top via C102, not the straight line; accepted)
- [ ] **T1.3b** `12V_RAW`: join the lower group (D101.1, C101.1, R108.1, user already routed these) to the trunk. Suggested: 1.5 mm from the trunk vertex (111.5, 91.25) straight down the gap x 111.65 to y 112.65, then west along y 112.65 to the existing 3 mm track at (103.15, 112.65). The left side of Q1 is blocked by the IN_FUSED track. Then R102.1 (113.3, 113.5) later with the branches (T1.4).
- [ ] **T1.4** `12V_RAW`, branches: R102 pad 1, R108 pad 1, J22 pin 1, U102 pin 4.
- [ ] **T1.5** `12V_RAW`, regulator: U501 pin 3 and C501 pad 1 (0.5 mm is enough; the net class decides).
- [ ] **T1.6** `12V_MID`: Q2 pin 2 to K1 pin 1 and R105 pad 1.
- [ ] **T1.7** `12V_ARMED`, main trunk: K1 pin 3 to F2 pad 1 and F3 pad 1.
- [ ] **T1.8** `12V_ARMED`, branches: C505, C509, C515 pad 1; U503 pin 3, U505 pin 3, U509 pin 8; R106, R107, R109, R510 pad 1; R530 pad 2.
- [ ] **T1.9** `OUT1`: F2 pad 2 to J3 pin 1 (1.5 mm). `OUT2`: F3 pad 2 to J4 pin 1 (1.5 mm).

## M2 and later

Not written yet.

## Log

- 2026-11-18: C501 and C509 swapped (C501 now 3.5 mm below U501 pin 3; C509 beside C505). 12V_RAW left spur (U102.4, U501.3 joined; C501.1 and the link to J22.1 still open, 0.5 mm).
- 2026-11-18 15:37: routed: 12V_IN, IN_FUSED, OUT1, OUT2, 12V_MID Q2.2-K1.1, 12V_ARMED trunk K1.3-F2.1-F3.1, 12V_RAW J22.1 joined to lower group. Open: 12V_RAW (6 pieces), 12V_MID R105.1, 12V_ARMED branches.
- 2026-11-18: J3 and J4 moved 16 mm right (J3.1 at 123.15,132.38; J4.1 at 135.15,132.38) so OUT1/OUT2 run straight down from F2/F3. T1.9 coordinates: F2.2 (128.14,119.25), F3.2 (135.39,119.25).
- 2026-11-18: T1.3 done: Q1.3 to Q2.3 routed as a 2 mm loop via C102.1; D101/C101/R108 group also routed by user but not yet joined.
- 2026-11-18: T1.2 done: IN_FUSED routed (3 mm, necked to 1.5 mm at Q1.2).

- 2026-11-18: T1.1 done: 12V_IN routed (3 mm, J1.1 to F1.1).

- 2026-11-18: T0.3 done: user confirmed the re-placed power area looks right.

- 2026-11-18: 12 V chain re-placed (second attempt; the first optimiser result left 3 of 8 links blocked). User must reopen and look (T0.3).
- 2026-11-18: T0.2 done. ARM power stage re-placed by a wire-length optimiser (chain length 349 mm to 177 mm); user to check (T0.3).
- 2026-11-18: T0.1 done: DRC shows only the 489 unconnected items (no clearance, courtyard, edge or hole errors).
- 2026-11-18: plan created; the board is placed (150 x 125 mm), DRC fixes applied (net classes, severities, JP21 moved); no tracks yet.
