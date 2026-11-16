# Woostar 6-pin DC-CDI (GY6 50–250 cc): reference unit

Source: the seller's product pictures, `woostar-6pin-dc-cdi.png` (box, connectors, 4-position DIP switch)
and `woostar-6pin-wiring-diagram.png` (wiring diagram). **Vendor information, not measured by us.**

## Wire functions (from the vendor wiring diagram)

| Connector | Position in the picture | Function | Wire colour |
|---|---|---|---|
| 4-pin | top left | **TRIGGER +** (pickup input) | blue / white |
| 4-pin | top right | **IGNITION** (output to the ignition coil primary) | black / yellow |
| 4-pin | bottom left | **GROUNDING** | green |
| 4-pin | bottom right | **GROUNDING** | green |
| 2-pin | top | **SHUT DOWN** (kill input) | not shown |
| 2-pin | bottom | **POWER SUPPLY +** (12 V) | not shown |

The picture shows the connector from one side only, so the pin positions may be mirrored on the harness side.
Wire by function and colour, and confirm each pin with the multimeter before powering.

## What this tells us for CH-TG

- The trigger input is a **single wire (TRIGGER +) referenced to the CDI ground**, so the simulated pulse
  goes between that wire and ground. The generator output stage lives in the 12 V power domain (GND_P) and is
  isolated from the Pico by the optocoupler, as designed.
- Two green ground pins: probably one for the pickup/trigger return and one for the power ground. To confirm.
- A **SHUT DOWN** input exists. A photo-relay pulling it to GND_P would let us test the kill function.
- `POWER SUPPLY +` comes from `12V_ARMED` (J3), and the coil primary connects to the IGNITION wire.

## Measured by the user (2026-11-16, CDI unpowered, DMM ohms, 2 MΩ range)

| Between | Reading | What it means |
|---|---|---|
| TRIGGER + and ground | **14.95 kΩ** (one probe polarity only) | The trigger input is a resistive load of about 15 kΩ to ground. A pickup coil (about 500 Ω) drives it easily. A generator needs little current. Check the reversed polarity too, to see whether there is a diode in the path |
| the two green grounds | **0.00 Ω** | Same net |
| IGNITION and ground | **> 2 MΩ (OL)** | Open at rest, as expected for a capacitor-discharge output |
| POWER + and ground | **about 630 kΩ** | High impedance at rest |
| SHUT DOWN and ground | **started at a few hundred kΩ and kept rising** | A capacitor charging through the meter: effectively open. The active level (grounded or high) is not known yet |

DIP-switch positions: not recorded yet.
