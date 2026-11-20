# Routing progress (read this first when resuming)

**RESUME HERE (2026-11-20): routing + silkscreen done, board named SPARKBENCH Rev A (D27). Gerbers plotted to hardware/kicad/mainboard/gerbers/ (8 layers + job file); DRILL FILE MISSING. Next: user generates drill file, re-runs DRC after the silk fixes; Claude checks the set, zips it, JLCPCB order settings, tag hw-mainboard-revA.**

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
| M8 | I/O sheet: Pico, expanders, headers J8, J9, J10 | open (logic side re-placed 2026-11-19) |
| M9 | Cleanup: DRC to zero, silkscreen, Gerbers | open |

Tasks of later milestones are written when we reach them (the part positions may still change).

## Logic side, guided order (after the re-placement 2026-11-19)

Codes: T top (F.Cu), B bottom (B.Cu), V vertical, H horizontal, ↗↖↘↙ 45°, "via" = press V while routing. Width 0.25 mm unless stated.

### L1 J8 (all T)
- [x] L1.1 HV_RANGE1  R326.1 → J8.16   T H←
- [x] L1.2 HV_RANGE0  R325.1 → J8.15   T H←
- [x] L1.3 DRV_OUT    U1.16 → J8.10    T V↑ under Pico, ↖ between top-row pins, ↖ in
- [x] L1.4 RIG_TACH   U1.15 → J8.9     T V↑, ↖ in
- [x] L1.5 RIG_PWM    U1.14 → J8.8     T V↑, ↖ in
- [x] L1.6 SP_IN      U1.12 → J8.7     T V↑ straight
- [x] L1.7 HV_CMP     U1.11 → J8.6     T V↑, ↗ in
- [x] L1.8 EXP_INT    U1.27 → J8.12    T V↑ short, via, B ↗ in
- [x] L1.9 GP16_SPARE U1.21 → J8.11    T ↖ H← ↖ (gap between J8 and Pico)
- [x] L1.10 VSYS      U1.39 → J8.13    T 0.5 mm: ↗ then H→ along the gap, ↘ in
- [x] L1.11 GP1_SPARE U1.2 → J8.5      T ↗ long under Pico, via, B ↗ in

### L2 J10 (T unless stated)
- [x] L2.1 EXP2_B2..B7  U3.3..8 → J10.15..20   T ↗ fan, B2 first, each next one outside the previous; B7 may need via + B H→ at the end
- [x] L2.2 EXP1_B0..B3  U2.1..4 → J10.11..14   T V↑ straight up the free strip right of U3, small ↖ at the end
- [x] L2.3 R318.1 → J10.3, R319.1 → J10.4      T short
- [x] L2.4 R4_EN, INS_EN, HV_PKRST  U3.21/22/25 → J10.3/4/5   T H→ in the U3/U2 gap, via, B H→ under the EXP1 lines, via, T ↗ V↑ in
- [x] L2.5 ADS1_ALRT JM1.6 → J10.6, ADS1_A3 JM1.10 → J10.8   T V↑ left of JM1 (via + B at the end if blocked)
- [x] L2.6 HV_RANGE0/1  U3.23/24 → R325.1/R326.1   T H← in the U3/U2 gap, ↖ up between Pico and U3, H← to R325/R326
- [x] L2.7 EXP_INT  U2.20 → U1.27   T ↖ H← in the U3/U2 gap, ↖ to the Pico (via at the end if blocked)

### L3 I2C bus and EXP_RESET (T unless stated)
- [x] L3.1 SCL  J8.4 → U3.12     T V↑ out of J8.4, H→ hugging the top edge (outermost line), past R301, via, B ↘ V↓ into U3.12
- [x] L3.2 SDA  J8.3 → R301.2/U3.13   T ↗ up between J8.4 and J8.6, H→ just under SCL, V↓ left of R301, H→ into the R301.2–U3.13 line
- [x] L3.3 SDA  U3.13 → U2.13    B (no via): V↓ under U3, out between U3.16/U3.17, ↘ across the gap, into U2.13
- [x] L3.4 SCL  U3.12 → U2.12    B (no via): parallel, out between U3.17/U3.18, ↘, into U2.12
- [x] L3.5 EXP_RESET  U3.18 → R303.2   T V↓ short
- [x] L3.6 EXP_RESET  U1.26 → R303.2   B ↘ short out of U1.26 (under DRV_OUT), via, T ↘ H→ just below the U3 bottom row, into R303.2 from the left
- [x] L3.7 EXP_RESET  R303.2 → U2.18   T H→ short, via (left of the HV_RANGE lines), B H→ ↘, V↓ between U2.12/U2.11 under the U2 body, ↘ into U2.18
- [x] L3.8 SDA  U2.13 → JM1.4    T ↘ into the U2 body, H→ (above EXP_INT), V↑ out between top pins, ↗, via, B H→ under the EXP1 lines, via, T H→ into JM1.4
- [x] L3.9 SCL  U2.12 → JM1.3    T ↗, H→ above U2, ↗ V↑, H→, via, B H→ under the EXP1 lines (above SDA), via, T ↗ into JM1.3
- [x] L3.10 SDA JM1.4 → U506.2   T ↘ out, V↓ in the narrow strip hugging the JM1 pins (left of the C201-C205/NT1 column), below C202: via, B ↘ short (hop under the AGND trunk), via, T V↓ between R405.2 and the PR2 HV pins, ↘ right of R408/R409, ↘ to U506.2. Keep ≥1.5 mm from PU_IN/PU_MID/PR1_B/PR2_B pads
- [x] L3.11 SCL JM1.3 → U506.3   T same path, always on the right of SDA, same B hop under the AGND trunk; near U506: via, B V↓ short (crosses SDA), via, T ↘ into U506.3
  Why: the bus J8 → U3 → U2 → JM1 → U506 runs from the top edge to the slot, so AGND parts sit on both sides of it; one AGND crossing is unavoidable. Do it as a short I2C hop on B, so AGND stays unbroken on T. GND_L is the B fill: JM1.5 is a THT pin, NT1.2 gets its own via (in or right below the pad), so the I2C on T cannot cut it off.

### Later (details when we get there)
- L4 CH-R2 rows at JM1, R2_DRIVE from Pico, R2_CAL, R2_NODE
- L5 CH-PU right to left (PU_IN 0.3 mm class), U2 controls, peak detectors, Pico lines
- L6 TG/KILL lines to the LED resistors, ARM/MID/PWR/RLY lines
- L7 [x] AGND, 3V3, 3V3A done 2026-11-20 by Claude; still to do: GND_L stitching (script) and DRC. Plan was: AGND trunk to NT1 (right side: JM1.2 H→ C204.2, column C205.2-C204.2-NT1.1-C203.2-C201.2-C202.2 on T right of the I2C strip, then down across the I2C hop to R405.2 and on to CH-PU; NT1.2 via to the B fill), 3V3A, 3V3, GND_L stitching (script), DRC

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

- 2026-11-20: L1 and L2 checked. All 26 nets routed, closest gap 0.22 mm (EXP_INT to J8.11). User variations, all fine: VSYS on B.Cu at 0.5 mm; HV_RANGE0/1 run H← through the U3 body and out of its left end; R4_EN/INS_EN enter U3 from above through the body; EXP_INT runs under the U2 body then B ↖ to U1.27; R301/R302 sit right above U3.13/U3.12. 86 nets routed, 66 open. L3 steps written (trial-routed).
- 2026-11-20 (2): L3.3-L3.9 checked: SDA/SCL U3 to U2 to JM1 and EXP_RESET routed, closest gap 0.29 mm. User variations: SDA/SCL run under the U2 body on T, then via and B V↑ between U2 and JM1; EXP_RESET is almost all B (U1.26 up, B H→ above the Pico top row, via into U3.18, B ↘ to U2.18), about 49 mm of B; check the B ground fill around it at L7. 92 nets routed, 60 open.
- 2026-11-20 (3): user spotted that the first L3.10/L3.11 path ran down the AGND column next to NT1 and close to the CH-PU HV parts. Re-planned with the AGND trunk and the HV pads as keep-outs: I2C stays in the strip next to JM1, hops the AGND trunk once on B below C202, keeps ≥1.5 mm from the PU HV pads.
- 2026-11-20 (4): L3.1/L3.2 done by user (SCL on T along the top edge then B into U3.12; SDA on B along the top edge into U3.13). L3.10/L3.11 written into the board by Claude with KiCad closed: strip next to JM1 at x 113.2/113.9, B hop below C202, T down at x 117.3/118, diagonals to U506, SCL B hop near U506. Closest gap 0.225 mm (JM1 pins), ≥2.3 mm from PU HV pads. 94 nets routed, 58 open.
- 2026-11-20 (5): user tidied L3 and routed small nets around U403/U404. Claude routed AGND (0.5 mm; 0.3 mm out of J10.9), 3V3A and 3V3 (0.4 mm; 0.3 mm out of J10.7) with a new grid router (scratchpad proute.js: real pad shapes, 0.8 mm to PU_HV, B layer and vias penalised, kept out of the Pico W antenna end). AGND is one tree joining GND_L only at NT1; it crosses the I2C at the planned B hop below C202. 3V3 from U1.36 has the longest run (about 49 mm, 18 mm of it on B under the J8/Pico gap). Closest gap 0.22 mm. Trial-routed all 43 remaining signal nets afterwards: all still finish (R2_DRIVE_1K/10K from Pico pins 19/20 are about 70 mm either way). netcheck.js now uses real pad rectangles (it used to miss tracks ending in a pad corner). 107 nets routed, 45 open (GND_L/GND_P are the pours).
- 2026-11-20 (6): user asked Claude to finish all remaining signals (user will tidy angles and looks). Claude routed all 43 open logic-side nets with proute.js (shortest first; 0.25 mm, PU_IN/PU_MID/PR1_B/PR2_B 0.3 mm with 0.8 mm clearance to everything). 197 vias added. Closest gap 0.22 mm; PU_HV nets ≥0.82 mm. Long by placement: PU_PKRST_P/N (84/93 mm, U2 to the peak detectors under the Pico), R2_DRIVE_1K/10K (66/71 mm), MID_SENSE, KILL_HI/KILL_GND, PU_BUF (64 mm, 10 vias). R2_DRIVE_1K/10K and ARM_SENSE leave Pico pins 17/19/20 at the antenna end of the module. 150 nets routed; only the GND_L/GND_P pours open (not filled in the file).
- 2026-11-20 (7): user fine-tuned, added GND_L stitching vias (439 → 579 vias), refilled and ran DRC: 0 clearance errors; 11 starved thermals (JM1.5, J8.14, C511.2, PR2.2, R317.2, J10.10, U1.13, C301.2, J10.2, R313.2) and 5 unconnected (J8.14, R313.2, NT1.2, J10.2, one F island at R318/R319). Cause: zone clearance 0.3 + min width 0.3 means no fill fits between 2.54 mm header pins, and small SMD pads end up in cut-off F islands. Fix: short track from each pad to a via in the main B fill (NT1.2 and J8.14 to the vias already there).
- 2026-11-20 (8): Claude added 12 GND_L tracks + 10 vias at the starved/unconnected pads; refill + DRC left only J8.14 (one F.Cu spoke, boxed in by SCL/HV_RANGE1/header pins; also tied on B). Added mainboard.kicad_dru: min_resolved_spokes 1 for J8.14 only. DRC: 0 violations, 0 unconnected. Routing complete.
- 2026-11-19 23:05: user asked for a cleaner logic side (J10 flat above U2/U3, J6 and J7 side by side, J8 not tight on the Pico). Claude re-placed the logic side: J8 and J10 on the top edge, Pico under J8 with a 5 mm gap, U3/U2 flat and stacked, JM1 plus CH-R2 top right, J6 above J7 on the right edge, CH-PU along the lower band from J7 leftwards to the Pico; pull-downs moved to the destination end of their nets. A trial router over all logic nets scored the old placement 4895 mm / 133 vias / 15 nets it could not finish (22 with power nets first); the new one 3640-4100 mm / 91-122 vias / 5-6. All logic-side tracks and stitching vias removed (power side untouched; LED-resistor to opto links kept). 60 nets routed, 92 open.

- 2026-11-19 22:40: Claude moved J8 (2x8) from the top right to the top edge above the Pico (trial router: Pico to J8 signals 22-31 mm instead of 95-140 mm). Removed the old runs to J8 (GP1_SPARE, GP16_SPARE, VSYS, HV_RANGE0 beyond U3/R325, the half-done HV_CMP, the SDA/SCL top-edge runs) and one GND_L stitch via on the new J8.16; PU_PKP B.Cu run shifted to pass between J8 and the Pico. J10 stays. 100 nets routed, 52 open.

- 2026-11-19 19:05: user consolidated AGND into one 0.5 mm B.Cu trunk (JM1 keeps its own short run to the star). Claude: R314 beside U2 pin 5, R312 with R313, negative peak parts R420/C408/R419 above D403; removed 4 dangling AGND stubs and a one-layer via near NT1. 69 nets routed.

- 2026-11-19 18:10: DRC 0 errors (180 unconnected). Re-placed: J7 to right edge (rot 90) with D401, PR1/PR2, R402/R405 (loads), R408/R409 (divider), R403/R406/R407 beside it; JM1 moved next to CH-R2 (rot 270, row at board y 45, module body over the free area below it); CH-PU decaps C403-C406 at their IC supply pins; peak detectors D402/D403 + R417-R420, C407/C408 above U401/U402; VB_RAW divider R414/R415/C402 under U401; R410-R412, JC2, R413 under U402.

- 2026-11-19 17:56: NT1 pad 2 tied to GND_L via by track (starved thermal gone); R2_NODE fully routed (PR3.3 joined). DRC: 1 clearance (new GND_L via at abs 33.15,69.30 vs R2_NODE track, 0.13 mm), 180 unconnected. 67 nets routed.
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
