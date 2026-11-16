# Net checks for the mainboard design (2026-11-16)

Two parts: an **automated script** that cross-checks every pin assignment, and a **manual electrical review** of each block.
Run the script again after any change to pins or docs:

```bash
node tools/checks/net-check.mjs                       # pin and reference checks
KICAD_LIBS=~/kicad-libs node tools/checks/net-check.mjs   # also compares the KiCad symbols
```

## 1. Automated checks (8 passed, 0 failed)

| Check | Result |
|---|---|
| Pico pin table in `mainboard.md` against the golden GPIO map and the Pico pin numbering (26 pins) | pass |
| `docs/pin-budget.md` has a row for every GPIO and every expander line | pass |
| Every `GPn` / `EXPn.xy` mentioned in the block docs and diagram scripts agrees with the map (33 references, 11 files) | pass |
| No net name on two GPIOs or on two expander lines | pass |
| Every net that is not marked "later" appears in a block doc or diagram | pass |
| KiCad `RaspberryPi_Pico` symbol (the Pico_W symbol inherits it): all 40 pin numbers and names | pass |
| KiCad `MCP23017x-x-SO` symbol (the SP symbol inherits it, default footprint `Package_DIP:DIP-28_W7.62mm`): the 26 pins we use | pass |

The first runs also found two false alarms in the checker itself (range names such as `TG_IMP0–2`, and a text line that mentions two signals).
Both are fixed in the script.

## 2. Findings from the manual review

| # | Finding | Severity | Status |
|---|---|---|---|
| F1 | **The failure table said a welded relay K1 shows up on `ARM_SENSE` with both switches off. That is wrong:** Q2 is the only source, so with Q2 off the rail is dead whatever K1 does. A welded K1 is invisible until tested. | real, safety-related | **Fixed.** New "weld check" at every arming: K1 commanded open, Q2 on for 50 ms, `MID_SENSE` must go live and `ARM_SENSE` must stay dead. Healthy case keeps the outputs dead. Documented in `power-arm.md` and on the schematic. |
| F2 | I told you the Pico symbol is in `MCU_RaspberryPi`. It is in **`MCU_Module`** (`RaspberryPi_Pico_W`). | wrong name, no electrical effect | **Fixed** in `hardware/kicad/README.md`. |
| F3 | **GPIO drive strength.** GP0, GP6, GP7 and GP22 drive optocoupler LEDs through 330 Ω (about 6 mA). The Pico's default pad drive is 4 mA, which is marginal for the PC817 that must sink 9 V / 4.7 kΩ ≈ 1.9 mA with CTR ≥ 50 %. | real, firmware | **Open.** Firmware sets the pad drive of these four pins to 12 mA (pad control register, or the `drive` option if the MicroPython build has it). The expander outputs (25 mA each) are fine. Noted in `pin-budget.md`. |
| F4 | The "edges take 20–40 µs" claim for the PC817 was optimistic: a phototransistor driven hard into saturation has a storage delay. Realistic: tens of µs up to about 100 µs. | claim too optimistic | **Fixed** (text), to be measured on the bench. Still fine for pulses of 0.2–10 ms. |
| F5 | The CH-PU and CH-R2 docs never named their expander control lines (`PU_RANGE5/20/100`, `PU_LOAD1/2`, `R2_CAL1/2`). | documentation gap | **Fixed:** control-line tables added. |
| F6 | The Pico's I²C bus continues through the ADuM1250 to the 12 V side. **If the 12 V supply is off (side 2 unpowered) the logic side of the bus must still work** for the MCP23017s and the 0x48 module. | to verify | **Open:** check in the ADuM1250 datasheet (hot-swap behaviour with one side unpowered) before the PCB order. |
| F7 | ADS1115 modules usually carry their own 10 kΩ I²C pull-ups. In parallel with our 4.7 kΩ they give about 3.2 kΩ, still fine at 400 kHz. | note | **Accepted.** |

## 3. Voltage and current margins (checked by hand)

| Item | Rating | Worst case in our design | OK? |
|---|---|---|---|
| IRF4905 Q1 / Q2 gate-source | ±20 V | −16 V (Q1 at 16 V input), −13 V (Q2) | yes |
| PC817 output voltage | 35 V | 16 V (gate chains), 9 V (mux lines) | yes |
| AQY212EH (60 V) | 60 V, LED operate max 3 mA | ≤ 16 V; LED about 6 mA | yes |
| AQY210EH (350 V) | 350 V, 0.13 A (0.4 A peak) | pickup ≤ about 100 V (TVS clamps near 190 V), 100 mA into 1 kΩ | yes |
| SMAJ120CA stand-off | 120 V | ±100 V signal | yes |
| 4052 mux supply | 15 V | +9 V − (−5 V) = 14 V | yes |
| ICL7660S input | 12 V | 5 V | yes |
| TL072 total supply | 36 V | 12 V + 5 V = 17 V | yes |
| 78L05 / 78L09 input | 30 V | 16 V | yes |
| AP2112K input | 6 V | 5 V (from U10) | yes, but never feed it 12 V |
| ADS1115 inputs | VDD + 0.3 V = 3.6 V | 3.4 V (V_ARM_M at 16 V in), 3.3 V on the CH-R2 nodes (clamped) | yes |
| MCP6002, 74HC4066, TLV3202 | 6 V / 7 V / 5.5 V | 3.3 V | yes |
| Pico GPIO | 3.3 V (3.6 V abs.) | nothing above 3.3 V reaches a Pico pin | yes |
| MCP23017 output current | 25 mA per pin, 125 mA total | 6 mA per LED, at most about 10 on at once | yes |
| 12V_RAW loads | | relay coil 30–60 mA, LEDs about 5 mA, regulators about 15 mA | yes |
| 78L05 (U10) | 100 mA | 3V3_P side about 5–10 mA | yes |
| 78L05 (U12) | 100 mA | charge-pump input about 6–10 mA | yes |
| Pico 3V3 (OUT) | about 300 mA, shared with the Wi-Fi chip | external load typically < 30 mA, about 100 mA with every LED on | yes, with margin |
| CDI supply (J3) | F2 2 A, F1 5 A | unknown, a DC-CDI normally draws well under 1 A | to see with the real CDI |

## 4. Open verification items (datasheet checks, none changes the design unless it fails)

1. ADuM1250 with the 12 V side unpowered (F6).
2. Logic-high level of the chosen 4052 part at a 9 V supply (about 6–7 V needed; our control lines go to 9 V).
3. 74HC4066: the unused fourth switch (input and output to ground) and its on-resistance at 3.3 V.
4. ADS1115 module pin order (VDD, GND, SCL, SDA, ADDR, ALRT, A0–A3) against the module bought.
5. Relay K1: the DC contact rating on the G5LE-1 page.
6. AQY210EH through-hole (not the EHA) on the Reichelt page.
