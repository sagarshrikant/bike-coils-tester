# Routing progress (read this first when resuming)

**RESUME HERE (2026-11-19 17:45): logic side, CH-R2. AGND star done for CH-R2 (12 pads to NT1). Open: GND_L track NT1 pad 2 to a GND_L via (starved thermal), R2_NODE PR3 pin 3 not joined. Then long runs to Pico/JM1/U3, 3V3 backbone, 3V3A, VSYS, CH-PU.**

Routing rules: F.Cu with the net-class width; long runs may use B.Cu with vias; nothing crosses the slot; vias 0.6 / 0.3 mm.
default 0.25 mm); the bottom layer (B.Cu) is kept for the ground pours (milestone M2); nothing crosses the slot; vias 0.6 / 0.3 mm.

## Milestones (Claude's overview)

| M | Goal | Status |
|---|---|---|
| M0 | Preparation: DRC run, router settings | done |
| M1 | 12 V power path (J1 to the outputs) | done (DRC clean) |
| M2 | Ground pours GND_P, GND_L; AGND star | pours done, AGND star open |
| M3 | Supply rails (3V3, 3V3A, 3V3_P, VSYS, ±5 V, 9 V, MUX_VDD) | power-side rails done; 3V3, 3V3A, VSYS open |
| M4 | ARM stage signals (gate chain, relay, senses) | done |
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

- 2026-11-19 17:45: CH-R2 placed and partly routed; AGND star (12 pads incl. R209, Pico pin 33) reaches NT1. DRC: 1 error (NT1 pad 2 starved thermal, one spoke), 181 unconnected. R2_NODE: PR3.3 open. 66 nets routed.

- 2026-11-19 10:40: power side complete: last GND_P island joined, DRC shows only 2 dangling logic-side vias (VSYS, PU_NEG). 53 nets routed.
- 2026-11-19 10:35: U1 had been dragged 48 mm off the board; restored to its original place (22.93, 42.78, 90). Stray R2_DRIVE_1K via removed. 4 GND_P vias + short tracks added for islands (R511.2, U504.3, U101.3, U511.3). Load path widened by user (12V_MID 2 mm, OUT1/OUT2 1.5 mm, 12V_ARMED trunk 1.5-3 mm). netcheck: track end on another track copper counts as connected.
- 2026-11-19 09:41: Q3_G routed; user narrowed signal nets (SHUT, TG_S, PR5_B..PR9_B, Q2_G, MUX_A, MUX_INH, TG_FB*, V_AMP*) from 0.5 to 0.25 mm: fine (all under 100 mA). DRC 5: 3 starved thermals (GND_P islands), 2 dangling vias. 52 nets routed.
- 2026-11-19 08:21: Q2_G, DAC_P, DAC_N, V_AMPN_M, V_ARM_M routed. Open on power side: V_OUT_M (R503/R504 to R505/JM2.7), V_AMPP_M (JM2.8). DRC 17: 6 vias 0.5/0.3 (DAC_N, V_AMPN_M, V_AMPP_M x2 each), GND_P pours split into islands (starved thermals U505.2, U504.3, U101.3; R511.2 isolated).
- 2026-11-19 06:52: ARM_A2 routed, 7 small vias fixed, stray SDA_P/SCL_P vias gone. DRC 11: 3 small vias (Q2_G x2, TG_FBP), TG_FBN via vs V_AMPN_M via/track 0.15 mm, U505.2 starved thermal (B.Cu GND_P island). 43 nets routed.
- 2026-11-19 01:13: user saved. Routed: ARM_A1, ARM_B2, TG_FBN, TG_FBP, V_AMP+, V_AMP-. DRC: 20 annular_width + 20 via_diameter (vias 0.5/0.3, min 0.6), 1 hole_to_hole (V_AMP+/V_AMP- vias 0.45), 1 starved thermal (U505.2 GND_P island), 2 dangling vias (VSYS, PU_NEG). 41 nets routed, 111 open.
- 2026-11-18 23:45: 3V3_P routed (17 pads), DRC 2 warnings only.

- 2026-11-18 23:40: U1 rotation was already back at 90 (user undid it); removed stray TG_PULSE_B via at the old U1 pin 10. C511 (3V3 bypass of U506 pin 1) and C512 (3V3_P bypass of U506 pin 8) moved right next to U506 (board x 134, y 64.6 / 71.4, vertical). Saved file had unfilled zones: user must press B.
- 2026-11-18 21:30: DRC 0 errors, 2 dangling-via warnings (DAC_N at board 54,99; V_AMP+ at 21,107; remove or use them in M6/M7). +5V_P and +9V_P routed. Open: -5V_P (U509.4, U510.7, rest), MUX_VDD (R521.1 alone).
- 2026-11-18: DRC after stitching: 3 GND_L vias removed (PU_HV clearance near R402/R407/R409, hole-to-hole near J8). Keep stitching vias 1.5 mm further from PU_HV parts in future.
- 2026-11-18: GND_L pours (F.Cu, B.Cu) drawn by user; 144 GND_L stitching vias added by script; U507.2/U508.2 set to solid connection. AGND star still to do.
- 2026-11-18: JM2 (ADS1115 0x49, power-side nets) was wrongly on the logic side; moved to the 12 V side (x 140, y 87). 107 GND_P stitching vias added by script (0.6/0.3). U508.2 and U507.2 are still isolated top-layer pads (surrounded by other tracks); user fixes by hand.
- 2026-11-18 18:44: M1 DRC: only unconnected items left (447); dangling stub and C513/R528 courtyard fixed by user. Next: M2 ground pours.
- 2026-11-18 18:40: netcheck.js fixed (a track end on the body of another track counts as connected). 12V_ARMED is fully routed (14 pads). M1 complete: all seven power nets routed.
- 2026-11-18 18:34: 12V_ARMED down to 2 pieces ([U503.3 R106.1 C509.1] and the main group); V_ARM_M R510-R511 joined (JM2.10 later, M8).
- 2026-11-18 18:25: U509.8 joined to the 12V_ARMED main group (via + B.Cu). Open on 12V_ARMED: R530.2, C515.1, R510.1, C509.1, U503.3+R106.1. V_ARM_M open (R510.2/R511.1).
- 2026-11-18: R510 moved next to R511 (V_ARM_M divider), 2.3 mm apart.
- 2026-11-18: C515 moved next to U509 (6.8 mm), C505 next to U505 (4 mm), C509 beside R510. 12V_ARMED B.Cu line (U505.3 to K1.3, 0.5 mm) routed by user; open: C505, C509, C515, R510, R530, U503, U509.
- 2026-11-18 16:47: 12V_IN, IN_FUSED, 12V_RAW, 12V_MID, OUT1, OUT2 all routed. Only 12V_ARMED branches open.
- 2026-11-18: R110-R115 (logic parts: GND_L/3V3 nets) moved from the power side to the logic side, row at board y 58.5 above the opto sockets U101-U104 (they were wrongly in the power set). 12V_RAW: C102.1 piece found open after user save, to be checked.
- 2026-11-18 16:20: 12V_RAW fully routed (11 pads). Open: 12V_MID R105.1; 12V_ARMED branches.
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
