# SPARKBENCH mainboard Rev A: assembly and bring-up plan

Board: JLCPCB order Y30-2414780A, files tagged `hw-mainboard-revA`. Circuits: `hardware/circuits/mainboard.md`,
`power-arm.md`, `ch-r2-pcb.md`, `ch-pu-pickup.md`, `ch-tg-trigger.md`. Safety: `docs/safety.md` (read it again before stage 5).

**Rule:** build one stage, test it, write the result in `docs/test-results/pcb-revA.md`, then go to the next stage.
A failed check stops the build until it is understood. Small steps: tick each box as you go.

## Tools and what is still missing

- Multimeter (ohms, diode test, DC V), USB power meter for the Pico (cheap inline type), magnifier, flux, solder wick.
- **Stages 1–4 need only USB.** The logic side is powered by the Pico.
- **Stages 5–6 need a current-limited 12 V supply** (not on hand yet, see `docs/roadmap.md`). Do not use a car battery or an
  unlimited adapter for the first power-up. If there is no bench supply yet, stop after stage 4.
- Stage 7 (a real CDI firing) needs the ignition coil and the enclosed spark gap (Phase 3 items, not on hand).

## Where to measure (the board has no separate test points)

| Net | Probe point |
|---|---|
| GND_L | J8.2 or J8.14, J10.2 |
| 3V3 | J8.1, J10.1 |
| VSYS | J8.13 |
| 3V3A | J10.7, JM1.1 |
| AGND | J10.9, JM1.2, J6 DUT− |
| V_BIAS | U401 pin 1 |
| GND_P | J1 −, J9.4 |
| 12V_RAW | Q2 pin 3, U501 pin 3 |
| 12V_MID | K1 pin 1 (COM) |
| 12V_ARMED | J3 +, K1 pin 3 |
| 3V3_P | J9.3, JM2.1 |
| +5V_P / +9V_P / MUX_VDD | JP1 pins 1 / 3 / 2 |
| −5V_P | U504 pin 5 |
| SDA_P / SCL_P | J9.1 / J9.2 |

## Stage 0: bare board check (before any soldering)

- [ ] Look at both sides: the slot is cut through, no copper bridges at the slot, silkscreen readable, no scratches across tracks.
- [ ] Ohms, power off, nothing fitted:
  - [ ] GND_L to GND_P: **open** (over 10 MΩ). This is the isolation barrier.
  - [ ] AGND to GND_L: about 0 Ω (through the net tie NT1).
  - [ ] AGND to GND_P: open (JP21/JP22 not bridged).
  - [ ] 3V3 to GND_L, 3V3A to AGND, VSYS to GND_L: open.
  - [ ] 12V_RAW, 12V_MID, 12V_ARMED to GND_P: open. 3V3_P to GND_P: open.
  - [ ] Any logic net to any power net (e.g. J8.1 to J1 +): open.
- [ ] If a short shows up: write down the two nets and tell Claude. The PCB file is the reference.

## Stage 1: logic power (USB only)

Fit: the Pico socket (2 × 1×20 female headers), SW301, the 3V3A filter (10 Ω, 10 µF, 100 nF), the 100 nF decoupling of the logic side,
the I²C pull-ups (4.7 kΩ to 3V3). Leave the Pico out for the first check.

- [ ] Ohms again: 3V3 to GND_L and VSYS to GND_L still open.
- [ ] Plug in the Pico (USB end toward the board edge as on the silkscreen), USB to a phone charger or laptop through the USB meter.
- [ ] 3V3 at J8.1: 3.3 V ± 0.1 V. 3V3A at J10.7: within 0.05 V of 3V3. VSYS at J8.13: about 4.7–5 V.
- [ ] USB current: tens of mA (as before on the perfboard). Anything near 200 mA with no firmware running means a short: unplug.
- [ ] SW301 resets the Pico (the REPL reconnects).
- [ ] GND_L to GND_P with the Pico powered: still no connection (measure DC volts between them: floating / noise only).

## Stage 2: I²C on the logic side

Fit: U2 (EXP1, 0x20) and U3 (EXP2, 0x21) with their 100 nF and pull resistors (the PU_RANGE, TG, R2_CAL, KILL, HV_RANGE pulls),
the EXP_RESET pull-up, header JM1 (1 × 10 female) and the J8/J10 headers.

- [ ] **Before plugging the ADS1115 module into JM1, compare its pin order with the board:** JM1 is 1 = VDD (3V3A), 2 = GND (AGND),
      3 = SCL, 4 = SDA, 5 = ADDR (GND_L, gives 0x48), 6 = ALRT, 7–10 = A0–A3. A module with a different order must not be plugged in.
- [ ] I²C scan from the REPL (`machine.I2C(0, sda=Pin(4), scl=Pin(5))`, `scan()`): expect **0x20, 0x21, 0x48**.
      (0x49, 0x60, 0x61 appear only in stage 6, when the power side is supplied.)
- [ ] EXP_RESET (GP20) low/high resets both expanders (their outputs go back to the pulled defaults).
- [ ] Read back every expander line at its pulled default (the table in `hardware/circuits/mainboard.md`). PU_RANGE100 and MID_SENSE read high, the rest low.

## Stage 3: CH-R2 resistance (repeats the Phase 1 tests on the PCB)

Fit: R_REF1 1 kΩ / R_REF2 10 kΩ (0.1 %), R_S, the 100 nF filters, D201 (5 V TVS), PR3/PR4 with R_CAL1 510 Ω / R_CAL2 47 kΩ, JC1 with
the BAT54S clamp module, J6.

- [ ] Firmware: `resistance.py` needs the ADS1115 driver (see `ch-r2-pcb.md`, "Firmware change"). This is a firmware task for Claude
      before this stage; the perfboard firmware reads the Pico ADC and will not work here.
- [ ] Self-test, clips open: PR3 on → 510 Ω ± 3 % on the 1k range; PR4 on → 47 kΩ ± 3 % on the 10k range.
- [ ] Known resistors 47 Ω, 100 Ω, 1 kΩ, 10 kΩ, 47 kΩ within ± 2 %; compare with `docs/test-results/phase1.md`.
- [ ] Golden pickup coil resistance: compare with its saved baseline. **Phase 1 exit test on the PCB.**

## Stage 4: CH-PU pickup input

Fit: U401 (MCP6472: V_BIAS buffer + signal buffer), U402 (74HC4066), U403 (MCP6542), U404 (MCP4822), the divider 2 × 100 kΩ and the
range resistors, R_INJ, D401 (120 V TVS), PR1/PR2 with the load resistors, JC2 with its clamp module, J7. D402/D403 (peak hold) stay **DNP**.

- [ ] V_BIAS at U401 pin 1: 1.65 V ± 0.05 V. With J7 open, PU_SIG (GP26) reads about mid-scale.
- [ ] After reset, the ±100 V range is selected (PU_RANGE100 high) and both loads are off.
- [ ] PU_TEST self-test on all three ranges: steps of about 0.56 V / 0.12 V / 0.023 V at the ADC, each within ± 10 %.
- [ ] MCP4822 thresholds: PU_POS / PU_NEG toggle when the DAC thresholds are set below the self-test step.
- [ ] Flick test with the golden pickup on J7: waveform, +peak, −peak, polarity order. Loads PR2 (10 kΩ), then PR1 (1 kΩ). **Phase 2 work starts here.**
- [ ] Never connect a CDI output or ignition coil to J7 (safety.md).

## Stage 5: 12 V input and ARM stage (current-limited supply needed)

Fit: J1, F1 (5 A fuse in its holders), Q1, D101, the 470 µF on 12V_RAW, LED101, U501 78L05 → U502 3.3 V LDO (3V3_P), Q2 with its
gate resistors, U101 (U_ARM), K1, Q3, D102, U102 (U_RLY), U103 (U_MID), U104 (U_SENSE), the bleed resistor, LED102, J21/J22, F2/F3, J3/J4.
Panel switches: wire jumpers on J21 and J22 for the first tests (= SW1 on, E-STOP closed), then the real switches.

- [ ] Supply set to 12.0 V, current limit **100 mA**. Pico on USB.
- [ ] **Reverse test first:** connect J1 the wrong way round. Current stays near 0, nothing gets warm, LED101 off. Then connect it correctly.
- [ ] LED101 on. 12V_RAW 12 V, 3V3_P at J9.3 3.3 V. Supply current with outputs off: a few tens of mA (78L05 + LDO + LED).
- [ ] 12V_MID and 12V_ARMED: 0 V (both switches off after reset). LED102 off.
- [ ] Remove the J21 jumpers (SW1A/SW2A and SW1B/SW2B open): commanding PWR_EN/RLY_EN does nothing. Refit them.
- [ ] Arm in the documented order (power-arm.md, "Switching order"): RLY_EN high (K1 clicks, still 0 V on J3), then PWR_EN high:
      12V_MID and 12V_ARMED live, LED102 on, MID_SENSE and ARM_SENSE read live.
- [ ] Disarm: PWR_EN low first, then RLY_EN low. 12V_ARMED falls to 0 V through the bleed resistor within a second.
- [ ] Weld check (K1 open, Q2 on for 50 ms): MID_SENSE live, ARM_SENSE stays dead.
- [ ] Each fault in turn while armed: unplug USB; press SW301; open the E-STOP jumper. Each one must drop 12V_ARMED.
- [ ] Isolation with 12 V on: DC volts between GND_L and GND_P float (no fixed voltage), and USB current does not change when the supply is switched on.
- [ ] Raise the current limit to 1 A only after all of the above pass.

## Stage 6: CH-TG trigger generator (power side, no CDI yet)

Fit: U506 (ADuM1250), header JM2 + the second ADS1115 module, U507/U508 (MCP4725), U503 78L05 → U504 ICL7660 (−5V_P), U505 78L09
(+9V_P), JP1 with the jumper on **2–3**, U510 (4052), U509 (TL072), U511/U512/U513 (PC817), PR5–PR9 with their resistors,
D501 (15 V TVS), J5, J9.

- [ ] JM2 module pin order check, as in stage 2: 1 = VDD (3V3_P), 2 = GND (GND_P), 3 = SCL_P, 4 = SDA_P, 5 = ADDR (3V3_P, gives 0x49).
- [ ] Disarmed (only 3V3_P present): the I²C scan now also shows **0x49, 0x60, 0x61** through the isolator.
- [ ] Armed, **J5 not connected:** +9V_P at JP1.3 about 9 V, +5V_P at JP1.1 about 5 V, −5V_P at U504.5 about −4.5 to −5 V.
- [ ] V_AMP+ and V_AMP− follow the DAC codes (read them back on JM2 AIN1 / AIN2). V_ARM_M (AIN3) matches 12V_ARMED.
- [ ] OUT idle: 0 V. With the enable off (TG_EN low) the pulse lines change nothing (INH holds the mux open).
- [ ] Long test pulse (100 ms) into no load: V_OUT_M shows the set amplitude, positive (TG_PULSE_A) and negative (TG_PULSE_B).
- [ ] Source impedances PR5/PR6/PR7 one at a time (exactly one on), and PR8/PR9 on J5.2 (scope or meter).
- [ ] Short pulse timing on a scope if one is available (edge times about 20–100 µs, to be measured).

## Stage 7: first real CDI (Phase 3, later)

Only with an ignition coil and the enclosed spark gap 30 cm away, the CDI powered from J3, J5 wired, the current limit at 1–2 A and
everyone following `docs/safety.md`. Start with the golden DC-CDI and the lowest V_AMP+. The plan for this stage is written with Phase 3.

## Results and fixes

- Results: `docs/test-results/pcb-revA.md` (one section per stage: what was fitted, each check, measured value, pass/fail).
- Anything that needs a wire, a cut track or a changed value goes into a "Rev A fixes" list there, so Rev B can include it (D27: a
  modified board gets a pen mark A1, A2 ...).
