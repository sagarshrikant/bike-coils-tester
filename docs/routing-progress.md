# Routing progress (read this first when resuming)

**RESUME HERE: next task = T0.2** (last updated 2026-11-18, nothing routed yet)

How we work: one small task at a time. The user routes in KiCad (PCB editor, `hardware/kicad/mainboard/mainboard.kicad_pcb`), saves,
says "T<n> done". Claude then checks the file with `node tools/pcb/netcheck.js hardware/kicad/mainboard/mainboard.kicad_pcb <NET>`
(shows ROUTED or OPEN with the pieces that are still separate; `--pads <NET>` prints pad coordinates; `--all` lists every net),
updates this file, commits, and gives the next task. DRC is the final judge. Claude never edits the PCB file while KiCad is open.

Rules for all tasks: power nets on **F.Cu** (top) with the width from the net class (Power5A 3 mm, Power2A 1.5 mm, PowerLogic 0.5 mm,
default 0.25 mm); the bottom layer (B.Cu) is kept for the ground pours (milestone M2); nothing crosses the slot; vias 0.6 / 0.3 mm.

## Milestones (Claude's overview)

| M | Goal | Status |
|---|---|---|
| M0 | Preparation: DRC run, router settings | open |
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
- [ ] **T0.2** Router settings: in the toolbar set the track width to "Use net class width" and the via size to "Use net class size". In Route, Interactive Router Settings, choose mode "Walk around obstacles".

## M1 12 V power path (all on F.Cu, 3 mm unless stated)

- [ ] **T1.1** `12V_IN`: J1 pin 1 to F1 pad 1.
- [ ] **T1.2** `IN_FUSED`: F1 pad 2 to Q1 pin 2 (drain).
- [ ] **T1.3** `12V_RAW`, main trunk: Q1 pin 3 to Q2 pin 3, then to C101 pin 1, C102 pin 1 and D101 pin 1.
- [ ] **T1.4** `12V_RAW`, branches: R102 pad 1, R108 pad 1, J22 pin 1, U102 pin 4.
- [ ] **T1.5** `12V_RAW`, regulator: U501 pin 3 and C501 pad 1 (0.5 mm is enough; the net class decides).
- [ ] **T1.6** `12V_MID`: Q2 pin 2 to K1 pin 1 and R105 pad 1.
- [ ] **T1.7** `12V_ARMED`, main trunk: K1 pin 3 to F2 pad 1 and F3 pad 1.
- [ ] **T1.8** `12V_ARMED`, branches: C505, C509, C515 pad 1; U503 pin 3, U505 pin 3, U509 pin 8; R106, R107, R109, R510 pad 1; R530 pad 2.
- [ ] **T1.9** `OUT1`: F2 pad 2 to J3 pin 1 (1.5 mm). `OUT2`: F3 pad 2 to J4 pin 1 (1.5 mm).

## M2 and later

Not written yet.

## Log

- 2026-11-18: T0.1 done: DRC shows only the 489 unconnected items (no clearance, courtyard, edge or hole errors).
- 2026-11-18: plan created; the board is placed (150 x 125 mm), DRC fixes applied (net classes, severities, JP21 moved); no tracks yet.
