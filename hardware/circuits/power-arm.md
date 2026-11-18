# 12 V input and ARM stage (approach accepted)

Schematic: [`../diagrams/power-arm-schematic.drawio.svg`](../diagrams/power-arm-schematic.drawio.svg)
Decisions: D10 (ARM switch, programmable hardware), D14 (two power domains).

> **Status:** approach accepted (D14, with the series relay), not built and not bench-tested. Values are calculated.

## Purpose

Everything that can hurt something (the CDI's 12 V supply, trigger drivers, later the coil driver)
runs from a switched rail, `12V_ARMED`, which is made by **two independent switches in series**: the
solid-state switch Q2 and the relay K1. The Pico, the ADS1115, the expanders and the measurement side
stay powered, so the service person can connect wires while every output is dead.

## Two power domains

| Domain | Ground | What is in it |
|---|---|---|
| **12 V power domain** | GND_P | J1 12 V input, fuse, reverse protection, `12V_RAW`, `12V_ARMED`, outputs to the CDI, trigger-driver supply |
| **Logic domain** | GND_L | Pico 2 W, ADS1115, MCP23017, CH-R2, CH-PU (the coil under test) |

The two are separated by optocouplers (and the CH-TG photo-relays later). The ignition-coil primary
current and CDI spikes flow in GND_P and never reach the logic ground. The Pico runs from USB, or from
the optional isolated 12 V → 5 V module (footprint, DNP) when you want it standalone. Both can be
connected at once: the module's output goes through a Schottky diode to VSYS, and the Pico has its own
diode from VBUS to VSYS (D22).

### Optional stand-alone supply (U_ISO, D_VSYS, both DNP)

| Part | Connection |
|---|---|
| U_ISO, 12 V → 5 V isolated, 14 V-tolerant input, 200 mA (no part ordered or chosen, D22) | +Vin = `12V_RAW`, −Vin = `GND_P`, +Vout = `5V_ISO`, −Vout = `GND_L` |
| C_ISO1 10 µF + C_ISO2 100 nF | `12V_RAW` to `GND_P`, at the module's input pins |
| C_ISO3 10 µF + C_ISO4 100 nF | `5V_ISO` to `GND_L`, at the module's output pins |
| D_VSYS 1N5819 | anode `5V_ISO`, cathode `VSYS` (band toward VSYS) |

- Place it on the **ARM sheet**. The existing PWR_FLAG on VSYS (I/O sheet) stays. Do not add a second flag.
- The input pins are in the 12 V domain and the output pins in the logic domain: the isolation slot runs between them, so the module straddles the slot like the optocouplers.
- Output: about 4.6 V at VSYS (5 V − 0.4 V diode drop), fine for the Pico 2 W (1.8–5.5 V).
- 200 mA must cover the Pico 2 W (Wi-Fi peaks), the 3V3 loads and anything taken from J8 pin 13 (VSYS). Check on the bench before relying on it; USB stays the default.
- **HV/safety:** the module's isolation (1–1.5 kV) is rated for 12 V use only. It does not make the logic side safe against a CDI fault. The CDI stays on `OUT`, never on this module.
- If a module is fitted later it must be a wide-input type. A 12 V ±10 % module (10.8–13.2 V in) is wrong: the bench supply may reach 14 V.

## How it works

1. **J1, F1 5 A, Q1.** Q1 (P-channel MOSFET, drain toward the input) is a reverse-polarity protection:
   with the supply the wrong way round, its body diode blocks and the gate stays at 0 V. D1 (SMBJ18A TVS)
   and C1 (470 µF) sit on `12V_RAW`. Input range: about 9–16 V (below 9 V Q2's gate drive gets weak).
2. **Q2 is switch 1,** a P-channel MOSFET with its **source on the input side**, so its body diode
   blocks when it is off. R_PU 10 kΩ holds Vgs at 0 (off). To turn it on, the gate must be pulled to
   ground through R_PD 2.2 kΩ **in series with** SW1 (ARM switch), SW2 (E-STOP, normally closed) and the
   transistor of optocoupler U_ARM. Gate voltage = 12 V × 2.2 / 12.2, so Vgs ≈ −9.8 V when on.
3. **Switch 1 needs all three:** `PWR_EN` high (the firmware says the self-test passed), SW1A ON, SW2A
   closed. Any one missing leaves Q2 off.
4. **`PWR_EN` (GP22) drives the U_ARM LED** through 330 Ω (about 6 mA) with a 10 kΩ pull-down, so it
   is off while the Pico is in reset, unpowered or hung and the watchdog has fired.
5. **K1 is switch 2 (the series relay),** SPST-NO with 10 A contacts, between `12V_MID` (after Q2) and
   `12V_ARMED`. Its coil (12 V, about 30–60 mA depending on the relay version) is fed from `12V_RAW` through the **second poles of the
   ARM switch and E-STOP (SW1B, SW2B)** and switched low-side by Q3 (2N7000). Q3's gate is driven by its
   own optocoupler U_RLY from its own GPIO, `RLY_EN` (GP0), with its own pull-down. D6 (1N4007) is the
   flyback diode. Switch 2 therefore has its own enable, optocoupler and switch poles: no single fault
   can defeat both paths.
6. **`MID_SENSE`** (a third optocoupler, expander input EXP2.A5) reads `12V_MID`. It tells the firmware
   which switch is at fault (see the table below).
7. **`ARM_SENSE` (GP13)** is a second optocoupler (U_SENSE) fed from `12V_ARMED` through 3.3 kΩ. It
   reports the **actual rail state**, not the request (low = live). The app uses it to show ARMED, and
   to raise an alarm if the rail is live when the firmware did not ask for it.
8. **R_BL 4.7 kΩ** bleeds `12V_ARMED` to ground when it is disarmed, and a red LED shows ARMED. A green LED
   on `12V_RAW` shows the supply is present.
9. **Outputs J3 / J4** each have a 2 A resettable fuse (F2). The load returns go to J1− / GND_P.

## Failure modes

| Fault | Result |
|---|---|
| Firmware hangs while armed | The Pico watchdog (enabled while armed) resets it, GP22 floats, the pull-down drops it, Q2 turns off |
| USB unplugged / Pico unpowered | `PWR_EN` is low, Q2 off |
| Supply connected backwards | Q1 blocks it |
| Over-voltage spike | D1 clamps it, F1 opens on a sustained fault |
| E-STOP pressed, or SW1 off | Q2 turns off (gate no longer pulled down) |
| Output short | F2 / F1, and the bench supply current limit |
| Q2 fails shorted | `MID_SENSE` reads live while Q2 is off. The relay is still open, so `12V_ARMED` stays dead. The app alarms ("Q2 fault"). |
| K1 welds closed | **Not visible while Q2 is off:** Q2 is the only source, so the rail stays dead and Q2 alone still protects. The weld is found by the **weld check** below (Q2 on, K1 commanded open, `ARM_SENSE` must stay dead). |
| **Both Q2 shorted and K1 welded** | The rail stays live. The app alarms from `ARM_SENSE`. Fallback: F1 and the bench supply's own output switch. Very unlikely (two independent failures). |

## Switching order

The relay should never break load current. **Arm:** close K1 first (`RLY_EN`, nothing is live yet because
Q2 is open), then Q2 (`PWR_EN`). **Disarm:** open Q2 first, then K1. Before arming, check that `MID_SENSE`
and `ARM_SENSE` both read dead (this catches a shorted Q2). After arming, check that both read live.

**Weld check (K1) at the start of every arming:** with `RLY_EN` low (K1 commanded open), close Q2 for about 50 ms and read the sense lines.
`MID_SENSE` must go live (Q2 works) and `ARM_SENSE` must stay dead (K1 really opened). If `ARM_SENSE` goes live, K1 is welded closed:
open Q2 at once and alarm. In the healthy case the outputs stay dead the whole time, so the check is safe; only in the fault case do the
outputs see 12 V for 50 ms. (The first version of this page said a welded K1 would show on `ARM_SENSE` with both switches off: that was wrong.)

## Panel wiring

SW1 is a **DPST** toggle with a cover (pole A in the Q2 gate chain, pole B in the relay coil feed). SW2 is
the E-STOP with two normally-closed contacts (or a wire jumper across each contact if unused). Four wires
go to the panel: SW1A, SW1B, SW2A, SW2B, on screw terminals J2.

## Layout notes (for the PCB)

- 5 A on `12V_RAW` and `12V_ARMED`: use wide traces (about 2.5 mm at 1 oz copper) or a pour.
- Keep the logic ground and the power ground separate. Under the optocouplers leave a gap of at least
  2 mm with **no copper** of either side crossing it.
- GND_P gets the heavy return path. Join GND_L to the Pico side only.
- Put SW1, SW2, the two LEDs and J3/J4 on the board edge, so panel wiring is short.

## Open items

- K1: pick a 12 V-coil SPST-NO PCB relay with at least 10 A DC contacts (for example Omron G5LE-1 or Hongfa HF115F class), and check the coil current and pin spacing.
- Pick the exact IRF4905 alternatives available at Reichelt, Farnell, Mouser. Check gate-source maximum (±20 V).
- Confirm the PC817 current transfer ratio is enough: the gate chain draws about 1 mA at 12 V, the LED
  gives about 6 mA, so any grade should work.
- Check the isolated DC-DC module's output (1 W, about 200 mA) against the Pico 2 W's Wi-Fi peaks (bench test with the module fitted).
- U_ISO: no module ordered, stays DNP. Pick the part and draw its footprint only if it is ever fitted.
