# KiCad project: mainboard

Project: `hardware/kicad/mainboard/mainboard.kicad_pro` (schematic `mainboard.kicad_sch`, board `mainboard.kicad_pcb`).
The files KiCad writes (`.kicad_pro`, `.kicad_sch`, `.kicad_pcb`) are text and belong in git. Backups and caches are ignored (see `.gitignore`).

## Library setup (the AppImage ships without the standard libraries)

Close KiCad, then in a terminal (matching tag 10.0.8, adjust it if your KiCad version differs):

```bash
mkdir -p ~/kicad-libs && cd ~/kicad-libs
git clone --depth 1 --branch 10.0.8 https://gitlab.com/kicad/libraries/kicad-symbols.git
git clone --depth 1 --branch 10.0.8 https://gitlab.com/kicad/libraries/kicad-footprints.git
cd ~/personal/projects/bike-coils-tester      # the repo folder on your computer
bash tools/kicad/make-lib-tables.sh
```

The script copies the library tables that ship with the libraries (they use path variables) into KiCad's config folder and writes the real
folders into them. It backs up any existing tables. (KiCad 10 stores each symbol library as a `.kicad_symdir` folder, not a single file.) The 3D model library is
very large and is not needed for the circuit or the board; skip it for now.

### Parts worth knowing in the standard libraries (checked in the 10.0.8 libraries)

| Part | Symbol | Footprint |
|---|---|---|
| Pico 2 W | `MCU_Module:RaspberryPi_Pico_W` (same pin layout; it inherits its pins from `RaspberryPi_Pico`) | `Module:RaspberryPi_Pico_Common_THT` (the pads for the two 1×20 sockets) |
| MCP23017 (SPDIP-28) | `Interface_Expansion:MCP23017x-x-SP` | DIP-28 narrow from `Package_DIP` |
| ADS1115 | `Analog_ADC:ADS1115IDGS` | VSSOP-10 from `Package_SO` |
| Resistor, capacitor | `Device:R`, `Device:C` | `Resistor_SMD:R_0805_2012Metric`, `Capacitor_SMD:C_0805_2012Metric` |
| Connector 1×N | `Connector_Generic:Conn_01x20` etc. | `Connector_PinSocket_2.54mm` / `TerminalBlock` |

## Source of truth for the drawing

| What | Where |
|---|---|
| Overview, Pico pins, expanders, connectors, test points | `hardware/circuits/mainboard.md` and `hardware/diagrams/mainboard-schematic.drawio.svg` |
| CH-R2 | `hardware/circuits/ch-r2-pcb.md` + `ch-r2-ads1115-schematic.drawio.svg` |
| CH-PU | `hardware/circuits/ch-pu-pickup.md` + `ch-pu-schematic.drawio.svg` |
| ARM stage and 12 V input | `hardware/circuits/power-arm.md` + `power-arm-schematic.drawio.svg` |
| CH-TG | `hardware/circuits/ch-tg-trigger.md` + `ch-tg-schematic.drawio.svg` |
| Parts and quantities | `hardware/bom-order-list.xlsx` |
| Pin map | `docs/pin-budget.md` |

## Suggested structure

- **Root sheet** = mainboard: Pico socket, the two MCP23017, the I²C bus, the connectors, test points.
- **One hierarchical sheet per block:** `ch_r2`, `ch_pu`, `arm`, `ch_tg`. Sheet pins carry the net names used in the docs.
- Use the **same net names as the docs** (`SDA`, `PU_SIG`, `12V_ARMED`, `MUX_A`, ...). Nets with the same name on one sheet are connected, so net labels are fine.
- Two grounds: **GND_L** and **GND_P**, with different net names, joined nowhere. Use a different ground symbol or name for each (for example `GND` for GND_L and `GNDP` for GND_P).
- Fill in the **Value** and **Footprint** fields from the order list. Add an **MPN** field with the part number you will actually buy.
- Run **ERC** and fix every error; do not just silence them.

## PCB checklist

- 2 layers, 1.6 mm. Board outline about 100 × 120 mm, 4 × M3 holes.
- **Isolation slot** of at least 2 mm between the logic and the 12 V regions: draw it on the board outline layer (Edge.Cuts) as a routed slot, with no copper crossing it. Only the optocouplers, photoMOS relays and the ADuM1250 span it.
- 12V_RAW / 12V_ARMED traces about 2.5 mm wide, or pours.
- Decoupling capacitors right at each IC supply pin.
- Footprints match the real parts (relay pin spacing, TO-92 pin order, terminal pitch 5.08 mm, SOIC-16, VSSOP-10).
- Run **DRC**, then check the 3D view.
- Export: PDF of the schematic, PNG/PDF of the layout, then Gerbers and drill files to `hardware/kicad/mainboard/fab/` (ignored by git).

## Generated sheets (netlist-style, every pin labelled)

| File | Content | Generator |
|---|---|---|
| `mainboard/mainboard-io.kicad_sch` | Pico, 2 × MCP23017, ADS1115 module headers, bus pull-ups, expander pull resistors, reset button, J8 | `KICAD_SYMBOLS=<kicad-symbols checkout> node tools/kicad/gen-io-sheet.mjs` |
| `mainboard/mainboard-ch-r2.kicad_sch` | CH-R2 resistance meter (R_REF, filters, clamp header JC1, TVS, self-test photoMOS, 3V3A filter, AGND tie) | `KICAD_SYMBOLS=<kicad-symbols checkout> node tools/kicad/gen-ch-r2-sheet.mjs` |
| `mainboard/mainboard-arm.kicad_sch` | 12 V input, Q1/Q2, relay K1, sense optocouplers, outputs | `KICAD_SYMBOLS=<kicad-symbols checkout> node tools/kicad/gen-arm-sheet.mjs` (add `--nets` to print the net list) |

Add them with Place → Add sheet. The global labels connect the sheets (PWR_EN, RLY_EN, MID_SENSE, ARM_SENSE, 3V3, GND_L).
Do not edit the labels by hand: change the generator, regenerate, and tell me.
