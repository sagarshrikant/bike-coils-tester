# Phase 1 bench results: CH-R2 resistance meter

Hardware: Pico 2 W on an expansion board, CH-R2 on perfboard
(`hardware/circuits/ch-r2-resistance.md`). Firmware 0.1.0, Pico in STA mode.
Target: within ± 2 % (± 3 % for 47 Ω), see the roadmap exit test.

"True" is the multimeter reading of the resistor. A blank means not measured yet.

## Bring-up log

| Step | Result | Notes |
|---|---|---|
| Wi-Fi link + web app | OK | Web build served from the laptop, opened on an iPhone, connected to the Pico |
| Open leads | not recorded | |
| Shorted clips (after fixes) | `raw_ohms` 4.26 | Stored with **Zero**: `lead_ohms` = 4.26 Ω. The cables alone read 0.2 Ω on a multimeter, so ~4 Ω is somewhere on the board (to be found) |

## Resistor measurements (after Zero, `lead_ohms` = 4.26)

| Nominal | True (meter) | Range | App reading | Error | Pass? |
|---|---|---|---|---|---|
| 47 Ω | 47.1 Ω | 1k | 46.79 Ω | −0.7 % | yes (± 3 %) |
| 100 Ω | 99.4 Ω | 1k | 102.32 Ω (mean of 5: 102.43, 101.96, 102.4, 102.3, 102.5) | +2.9 % | **fails ± 2 %**. Repeatable (spread ± 0.3 Ω), so it is not noise. `v_node` 0.3068 V vs ≈ 0.299 V expected |
| 1 kΩ | | 1k | | | |
| 10 kΩ | | 10k | | | |
| 47 kΩ | 47.2 kΩ | 10k | 47 368 Ω | +0.4 % | yes (± 2 %) |

## Golden pickup coil

First measurement (2026-11-16, clamp diodes still disconnected, `lead_ohms` = 4.26):

| Part | Meter | App | Error | Range |
|---|---|---|---|---|
| Golden pickup coil | 502–503 Ω | 508.66 Ω (`raw_ohms` 512.92, `v_node` 1.0905 V, `v_top` 3.2166 V) | ≈ +1.2 % | 1k |

Within ± 2 %. The app's "save baseline" button isn't built yet, so this entry is the baseline for
now. Repeat it with the clamp fitted and compare.

## Issues found and what fixed them

1. **Loose DUT connection.** Readings drifted from 88 to 35 000 Ω and `v_node` sat near 3.08 V
   (almost open). Fixed by re-making the DUT+ / DUT− joints.
2. **PMEG3050EP (low-drop 5 A Schottky) is unsuitable as the ADC0 clamp.** With D1 and D2 fitted,
   a shorted pair of clips read ≈ 42 Ω, and 47 Ω read ≈ 92 Ω, 100 Ω read ≈ 142 Ω. With only D2
   fitted, 47 Ω read ≈ 15.8 Ω (too low). Cutting the diode branch removed the errors. The
   diodes act like a leaky resistance at small voltages, because the barrier is very low. The
   clamp was left **disconnected** (track cut). Fit a BAT54S or a 1N5819 pair, preferably on a
   plug-in module, then re-test.
3. **Series resistance of ≈ 4.3 Ω in the DUT loop.** Removed by Zero, but the cause is still to
   be found (check the terminal, header and ground joints).

## Still to do

- [ ] Find why 100 Ω reads +2.9 % while 47 Ω and 47 kΩ are fine: measure more resistors on the 1k range (68, 82, 120, 150, 220, 330, 470, 680 Ω) and plot the error against `v_node`
- [ ] 1 kΩ and 10 kΩ readings, with multimeter values
- [ ] Find the ≈ 4 Ω in the loop, or confirm `lead_ohms` stays steady over a session
- [ ] Fit the clamp diodes (BAT54S or 1N5819), then re-measure the golden pickup coil and compare
- [ ] App: save the golden pickup coil as a baseline (feature not built yet)
