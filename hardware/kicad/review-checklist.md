# Review checklist for the generated sheets (to go through point by point)

The sheets are netlist-style: every pin has a global label. Nothing here was opened in KiCad by the generator's author
(no KiCad in the container), so open each sheet, run ERC and compare with the block page.

## All sheets
- Does each sheet open, and does ERC show only "pin not driven" / "label not connected" style warnings?
- Stand-in symbols (same pinout, other name): AQY282EH for AQY212EH and AQY210EH, MCP6002-xMS for MCP6472-E/MS, MCP6562 for MCP6542,
  HEF4066BT for 74HC4066, MCP1700x-330xxTT for MCP1702. The real names are in each symbol's Value field and the BOM.
- References: ARM 100-series, CH-R2 200, I/O 300, CH-PU 400, CH-TG 500. Annotate with "keep existing references".
- Single-label nets that are expected: VBUS, HV_RANGE0/1, HV_PKRST (CH-HV later), ADS1_ALRT, ADS2_ALRT, ADS1_A3_SPARE.

## ARM (`mainboard-arm`)
1. Relay K1: COM (pin 1) = 12V_MID, NO (pin 3) = 12V_ARMED, coil pins 2 and 5, pin 4 not connected. Compare with the Omron pin diagram.
2. Q1 drain toward the input (IN_FUSED), source = 12V_RAW. Q2 source = 12V_RAW, drain = 12V_MID.
3. Gate chain: Q2_G - R103 - J2A.1 ... J2A.4 - U101 collector. Jumper J2A 3-4 when there is no E-STOP; J2B likewise.
4. F1 footprint is empty until the ESKA clip is measured. D101 is SM6T18CA (stand-off 15.3 V: keep the supply at 14 V or below).

## CH-R2 (`mainboard-ch-r2`)
1. JC1: 1 = 3V3A, 2 = node after R_S, 3 = AGND. BAT54S pin order.
2. PR3 / PR4 pins: 1 LED anode, 2 LED cathode, 3 and 4 the switch.
3. NT1 net tie joins AGND to GND_L (the only connection between them).

## I/O (`mainboard-io`)
1. Compare every Pico pin label with docs/pin-budget.md. 2. Expander pull directions (RANGE100 up, all others down). 3. J8 pin list.

## CH-PU (`mainboard-ch-pu`)
1. Pickup input: IN- is AGND. R_T1 + R_T2 in series, axial 0.6 W. 2. U402 (4066): unused switch tied to ground, VDD = 3V3A.
3. U401 op-amp unit A (bias) and unit B (signal buffer). 4. Comparator input polarity: U403A signal on +, U403B signal on -.
5. Peak-hold parts (D402, D403, C407, C408, R417..R420) are marked do-not-populate.

## CH-TG (`mainboard-ch-tg`, paper A2)
1. 4052: X0 and X3 = GND_P, X1 = V_AMP-, X2 = V_AMP+, A = MUX_A, B = MUX_B, INH = MUX_INH, VEE = -5V_P, Y section all to GND_P.
2. Optocouplers: pull-ups to MUX_VDD (not 12 V). JP1 default jumper 2-3 (+9V_P).
3. MCP4725 addresses: U507 A0 = GND_P (0x60), U508 A0 = 3V3_P (0x61).
4. TL072: V+ = 12V_ARMED, V- = -5V_P. Amplifier A gain 3 (20k / 10k), amplifier B gain -1 (10k / 10k).
5. ADuM1250 pins: 1 VDD1, 2 SDA1, 3 SCL1, 4 GND1, 5 GND2, 6 SCL2, 7 SDA2, 8 VDD2. Isolation slot under it.
6. Measurement dividers feed JM2 (labels V_OUT_M, V_AMPP_M, V_AMPN_M, V_ARM_M).

## Not on any sheet yet
- Isolated 12 V -> 5 V module and the VSYS diode (Later). CH-HV, CH-SP, rig connectors (J8 only).
- Mounting holes, board outline, isolation slot (PCB layout).
