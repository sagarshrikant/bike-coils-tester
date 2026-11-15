# Safety — read before building anything

This tool works with circuits that can injure you. Ignition systems are designed to make
high voltage.

| Source | Typical voltage | Hazard |
|---|---|---|
| Pickup / pulser coil (spinning) | 0.5 – 50 V peak, more at high RPM | Low, but can destroy a Pico pin |
| AC-CDI exciter / source coil | 100 – 400 V AC peak | **Electric shock** |
| CDI storage capacitor / output | 200 – 400 V pulses, ~1 µF stored | **Electric shock, stays charged after power-off** |
| TCI coil primary (flyback) | 300 – 450 V spikes | **Electric shock** |
| Ignition coil secondary / spark | 15 – 40 kV | **Shock, burns, arcs to nearby electronics** |
| 12 V battery | 12 V, hundreds of amps | Burns and fire if shorted |

## Rules

1. **One hand rule** and no metal jewellery when HV is live. Connect clips only with the power off.
2. **Discharge before touching.** CDI units hold their charge. Wait, then short the output to ground
   through a 10 kΩ / 5 W resistor before handling.
3. **Spark gap in a closed enclosure.** Use an adjustable spark gap inside a non-conductive box,
   at least 30 cm from the Pico, laptop and phone. Earth the coil's ground to the rig ground.
4. **No HV on Pico pins, ever.** Every input that can see more than 3.3 V must have:
   a divider sized for the worst case, a series resistor (≥ 1 kΩ), clamp diodes to 3V3/GND
   (BAT54S) and a small filter capacitor. HV divider resistors must be HV-rated or several in
   series (≥ 1/4 W each, ≤ 200 V per resistor).
5. **Prefer a floating Pico.** Run the tester from a battery or an isolated supply and talk to it
   over Wi-Fi. Don't connect the tester to a laptop over USB while HV stages are running; a USB
   ground loop can put fault current through your PC. Use USB only for flashing, with HV stages off.
6. **Current-limited supply.** Test DC-CDIs and coils from a bench supply with the current limit set
   (start at 1–2 A), or from a battery through a fuse (5 A).
7. **AC-CDI testing** needs an HV AC source. That comes later (Phase 7) and gets its own safety
   review before we build it.
8. Add a **visible "HV LIVE" LED** and a **physical arm switch** to every stage that makes HV.
