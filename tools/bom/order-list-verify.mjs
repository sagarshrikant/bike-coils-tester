// "What it does + what to check" text for the order list, keyed by the Item text of a row in order-list-data.mjs.
// Written for someone who has not used the part: plain words first, then the numbers to compare in the datasheet.
export const VERIFY = {
  'Raspberry Pi Pico 2 W': 'You already have it: the Pico 2 W (RP2350 chip, with Wi-Fi), not the older Pico W (RP2040). Keep it in the sockets.',
  'SOT-23 to DIP adapter board': 'WHAT: a tiny board that lets you solder a SOT-23 part and plug it in by pins.\nCHECK: SOT-23 (3 pins) to 2.54 mm pins; it must give you three pins for the BAT54S (pins 1 and 2 on one side of the package, pin 3 on the other).',
  'LED 3 mm, green and red': 'CHECK: 3 mm, forward voltage about 2 V. With 2.2 kΩ at 12 V the current is about 4–5 mA, which is fine.',
  'Tactile push button': 'CHECK: 6 × 6 mm, 4 pins, normally open, through-hole.',
  'Test point, PCB loop or pad': 'CHECK: the hole diameter matches the footprint (about 1 mm); a loop lets you clip a probe on.',
  'Standoffs M3 + screws': 'CHECK: M3 thread, about 10 mm long, with matching screws; 4 per board.',
  'MCP23017 I/O expander':
    'WHAT: adds 16 extra input/output pins to the Pico over the I²C wires. We use it for the slow control lines (ranges, enables, relays).\nCHECK: it is the I²C version "MCP23017" (the SPI one is "MCP23S17", wrong). Package suffix "/SP" = skinny DIP-28, 7.6 mm (300 mil) between the rows; "/SO" = SOIC-28. Supply 1.8–5.5 V (we use 3.3 V). It must have the RESET pin (pin 18) and address pins A0–A2.',
  'ADS1115 breakout module (I²C, 0x48)':
    'WHAT: a precise voltmeter (16-bit, 4 inputs) that the Pico reads over I²C. It measures the resistance-meter voltages much more accurately than the Pico\'s own ADC. It comes ready-made on a small board with a 1×10 pin header.\nCHECK: the chip on it says ADS1115 (the ADS1015 is the 12-bit version, wrong), I²C interface. PIN ORDER: the board assumes VDD, GND, SCL, SDA, ADDR, ALRT, A0, A1, A2, A3 (pins 1–10): compare with the module you buy, and tell me if it differs. Supply 3.3 V; some cheap modules add 10 kΩ I²C pull-ups, which is fine. Pin pitch 2.54 mm.',
  'ADS1115 breakout module (I²C, 0x49)': 'Same module as the 0x48 one. The address 0x49 comes from wiring ADDR to VDD on the board.',
  'Female header 1×10, 2.54 mm': 'WHAT: the socket the ADS1115 modules plug into. CHECK: 1×10 female, 2.54 mm pitch, through-hole. Make sure the module\'s pins are long enough and that its width fits the footprint.',
  'Resistor 1 kΩ, 0.1 %': 'WHAT: the reference resistor of the 1k range. The resistance reading is only as accurate as this part.\nCHECK: value 1.00 kΩ, tolerance ±0.1 % (not 1 %), temperature coefficient 25 ppm/K or better (50 ppm acceptable), size 0805, thin-film type. For Milestone-1 a 1 % part is acceptable if you measure it and enter the value.',
  'Resistor 10 kΩ, 0.1 %': 'Same as the 1 kΩ reference, for the 10k range. Value 10.0 kΩ, ±0.1 %, ≤ 25 ppm/K, 0805.',
  'Resistor 470 Ω, 0.1 %': 'WHAT: a known test resistor the board switches in to check itself. CHECK: 470 Ω, ±0.1 %, 0805.',
  'Resistor 47 kΩ, 0.1 %': 'WHAT: a known test resistor for the self-test of the 10k range. CHECK: 47 kΩ, ±0.1 %, 0805.',
  'PhotoMOS relay, 60 V class':
    'WHAT: a tiny solid-state relay. An LED on the input side switches a MOSFET on the output side, so the output is electrically isolated from the Pico, with no moving contacts. We use it to switch resistors and the SHUT DOWN line.\nCONFIRMED against the Panasonic datasheet (GU-E 1 Form A, AQY21□EH): AQY212EH is 1 Form A (normally open), 60 V, 0.55 A continuous (peak 1.5 A), LED operate current typ 1.2 mA / max 3.0 mA (our board gives about 6 mA), on-resistance typ 0.85 Ω, isolation 5 kV AC, DIP-4.\nCHECK on the order page: the name is AQY212EH, and NOT AQY212EHA (the "A" is the surface-mount lead form). Pins: 1 LED anode, 2 LED cathode, 3 and 4 the switch.',
  'PhotoMOS relay, 350 V class':
    'WHAT: the same kind of solid-state relay, but for the pickup input: when open, the full pickup voltage sits across it.\nCONFIRMED against the Panasonic datasheet: AQY210EH is 1 Form A, 350 V, 0.13 A continuous (peak 0.4 A for 100 ms), LED operate current typ 1.2 mA / max 3.0 mA, on-resistance typ 18 Ω (max 25 Ω), isolation 5 kV AC, DIP-4. A pickup at 100 V into the 1 kΩ load is 100 mA, inside the 0.13 A rating.\nCHECK: the through-hole AQY210EH, NOT the AQY210EHA (surface-mount leads). AQY214EH (400 V, 0.12 A) is also fine.',
  'TVS diode, bidirectional, 5 V':
    'WHAT: a protection diode that conducts only above a set voltage and clamps spikes (static, coil kick) on the DUT terminals.\nCHECK: suffix "CA" = bidirectional (needed: the node can swing negative). Stand-off voltage (VRWM) 5.0 V: it must NOT conduct below 5 V, because the node normally sits between about −3.3 V and +3.3 V. Breakdown voltage about 6.4 V. Check the leakage at 3.3 V (should be small). Package SMA (DO-214AC) for SMAJ, SMB for SMBJ: match the footprint.',
  'Schottky pair BAT54S':
    'WHAT: two small fast diodes in one package, used as the clamp at the ADC input (one diode to 3.3 V, one to ground) so a spike cannot reach the chip. They sit on a small plug-in module.\nCHECK: exactly "BAT54S" (the two diodes in SERIES: pin 1 = anode of D1, pin 2 = cathode of D2, pin 3 = the middle point). BAT54A (common anode), BAT54C (common cathode) and BAT54 (single) look the same but are wired differently, and would make the clamp wrong. Forward voltage about 0.3 V, leakage at 25 V in the microamp range. Package SOT-23. Do NOT use a big low-drop Schottky like the PMEG3050EP: it leaked and falsified the readings.',
  'Resistor 100 kΩ, 0.6 W, metal film':
    'WHAT: the top of the pickup voltage divider. It must survive a wrong connection to a few hundred volts.\nCHECK: 100 kΩ, 1 %, power 0.5–0.6 W, and a maximum working voltage ≥ 350 V (many small resistors are only rated 200–250 V; look for "Max working voltage 350 V or higher"). Body 0207 (about 6.3 × 2.5 mm), axial leads, metal film. Not carbon film.',
  'TVS diode, bidirectional, 120 V':
    'WHAT: protects the pickup input from voltage spikes.\nCHECK: "SMAJ120CA": the "CA" suffix means bidirectional (a unidirectional one would clamp negative pulses at −0.7 V and ruin the reading). Stand-off voltage (VRWM) 120 V, so it does not conduct at the ±100 V signals. Breakdown about 133–147 V. Package SMA (DO-214AC).',
  'MCP6002 dual op-amp, rail-to-rail':
    'WHAT: two amplifiers in one chip. We use them as unity buffers: one makes the 1.65 V reference, one drives the signal into the Pico.\nCHECK: dual (not the single MCP6001). Rail-to-rail input AND output, works at 3.3 V (supply 1.8–6 V). Pins: 1 OUT A, 2 IN− A, 3 IN+ A, 4 V−, 5 IN+ B, 6 IN− B, 7 OUT B, 8 V+. Package SOIC-8 (suffix /SN). Ordinary op-amps (LM358, TL072) do not work at 3.3 V.',
  '74HC4066 quad analog switch':
    'WHAT: four electronic on/off switches in one chip; three select the pickup input range.\nCHECK: "74HC4066" (the HC family works at 3.3 V). Do not buy the old "CD4066B": its resistance is too high at 3.3 V. On-resistance about 100–200 Ω at 3.3 V (fine). Package SOIC-14. It is the 4066 (4 switches), not 4051 (8-way mux) or 4053.',
  'Dual comparator, rail-to-rail':
    'WHAT: compares the pickup signal with a threshold and gives a clean digital edge for timing the pulses.\nCHECK: dual comparator, SOIC-8, supply down to 3.3 V or lower, and input range that includes BOTH rails (rail-to-rail inputs), because the thresholds sit around 1.3–2.0 V and the signal swings 0.15–3.15 V. Push-pull output is easiest (open-drain types need the 10 kΩ pull-ups fitted). Response time under 1 µs. Standard pinout: 1 OUT A, 2 IN− A, 3 IN+ A, 4 GND, 5 IN+ B, 6 IN− B, 7 OUT B, 8 V+.\nCORRECTION: the LM393 is NOT suitable here. Its inputs only work up to about 1.5 V below the supply (about 1.8 V at 3.3 V), which our thresholds and signal exceed. I removed it from the alternatives.',
  'MCP4822 dual 12-bit DAC (SPI)':
    'WHAT: a chip that turns two numbers from the Pico into two precise voltages (the comparator thresholds).\nCHECK: "MCP4822" is the 12-bit dual one (MCP4812 is 10-bit, MCP4802 is 8-bit, all look alike). SPI interface, internal 2.048 V reference, supply 2.7–5.5 V, package SOIC-8 (suffix /SN).',
  'P-channel MOSFET IRF4905':
    'WHAT: a power transistor used as an electronic switch for the 12 V supply (reverse-polarity protection and the ARM switch).\nCHECK: P-channel (not N-channel: IRF540 and similar are N-channel, wrong). Drain-source voltage −55 V or better, current ≥ 10 A (the part is 74 A), on-resistance ≤ 0.03 Ω at VGS = −10 V, gate-source limit ±20 V, gate threshold about −2 to −4 V. Package TO-220 (not the D2PAK "IRF4905S" variant). Pins on the TO-220: gate, drain, source (check against the footprint).',
  'Fuse holder + fuse 5 A':
    'WHAT: the main protection of the 12 V input.\nCHECK: holder for 5 × 20 mm glass fuses, PCB-mount, closed type. Fuse 5 A, rated for at least 32 V DC, fast-acting (F) or medium (M).',
  'Resettable fuse (PTC), 2 A hold':
    'WHAT: a fuse that cuts the current when it is too high and recovers after it cools. One on each 12 V output.\nCHECK: "hold current" 2 A (not the trip current), maximum voltage ≥ 16 V, radial through-hole, lead spacing matching the footprint.',
  'TVS diode 18 V (unidirectional)':
    'WHAT: clamps voltage spikes on the 12 V input.\nCHECK: "SMBJ18A": no "C" = unidirectional (correct here). Stand-off 18 V, so it does not conduct at up to 16 V input. Package SMB (DO-214AA), not SMA.',
  'Electrolytic capacitor 470 µF, 25 V':
    'WHAT: bulk energy storage on the 12 V input.\nCHECK: 470 µF, voltage ≥ 25 V, low ESR, radial. Check the diameter (about 10 mm), height and lead spacing (5 mm) against the footprint. The stripe marks the negative lead.',
  'Optocoupler PC817':
    'WHAT: passes a signal across an electrical gap using light (an LED on one side, a phototransistor on the other). It keeps the Pico side separate from the 12 V side.\nCHECK: single-channel "817" in DIP-4 (the PC847 is a 4-channel version, wrong). Output transistor voltage rating (Vceo) ≥ 35 V, current transfer ratio ≥ 50 %, isolation about 5 kV. LTV-817 and EL817 are compatible alternatives. Pins: 1 anode, 2 cathode (LED), 3 emitter, 4 collector.',
  'Power relay, 12 V coil':
    'WHAT: a mechanical switch operated by a coil. It is the second, independent switch in series with the MOSFET in the ARM stage.\nCHECK on the page: coil 12 V DC (about 30–60 mA depending on the version: a 2N7000 drives either easily), contacts 10 A at 24–30 V DC (the DC rating, not only the AC one), one changeover contact (SPDT / "1 Wechsler"): we use the normally-open contact and leave the other unconnected. Not latching, not an AC coil. CHOSEN: Omron G5LE-1 DC12 (KiCad footprint Relay_SPDT_Omron-G5LE-1). The "250 V 10 A" printed on it is the AC rating: for DC look for the DC line (about 8–10 A at 30 V DC); we switch under 5 A at 12 V, so it is plenty. The alternative Songle SRD-12VDC-SL-C has footprint Relay_SPDT_SANYOU_SRD_Series_Form_C.',
  'N-channel MOSFET 2N7000':
    'WHAT: a small transistor that switches the relay coil.\nCHECK: N-channel, 60 V, 200 mA or more (the coil needs 30–60 mA), gate threshold about 0.8–3 V. IMPORTANT: the pin order of the TO-92 case differs between 2N7000 (source-gate-drain) and BS170 (drain-gate-source); check the datasheet against the footprint.',
  'Diode 1N4007':
    'WHAT: absorbs the voltage spike when the relay coil switches off. CHECK: 1 A, ≥ 100 V; the band (cathode) goes to the +12 V side of the coil.',
  'Toggle switch DPST with safety cover':
    'WHAT: the ARM switch you flip by hand. DPST = two independent switches in one body.\nCHECK: DPST (double-pole single-throw), ON-OFF (not momentary), contact rating at least 1 A at 12 V DC (the DC rating), panel hole size, with a flip cover if possible. Not SPST (only one pole).',
  'E-STOP push button, 2 NC contacts':
    'WHAT: an emergency-stop button. CHECK: it has two normally-CLOSED (NC) contacts, latching. A pair of wire jumpers replaces it if you do not have one.',
  'Isolated DC-DC 12 V → 5 V, 1 W':
    'WHAT: a small module that makes 5 V from 12 V with electrical isolation, so the Pico can run from the same 12 V supply (optional).\nCHECK: input range: many "12 V" modules accept only 10.8–13.2 V, so a supply set above 13.2 V can damage it. Output 5 V, power ≥ 1 W (200 mA), isolation ≥ 1 kV, SIP package, pin order matches the footprint.',
  'ADuM1250 I²C isolator':
    'WHAT: carries the I²C wires across the isolation gap, so the Pico can talk to chips on the 12 V side without sharing a ground.\nCHECK: "ADuM1250" has TWO bidirectional channels (SDA and SCL). The ADuM1251 has one bidirectional and one one-way channel: wrong for I²C clock stretching. (Your choice, ADuM1250ARZ in SO-8 with 2 channels, is the right one.) Supply 3.0–5.5 V on both sides, package SOIC-8 (suffix ARZ), isolation 2.5 kV. The TI ISO1541 is a similar part: check that both lines are bidirectional.',
  'MCP4725 12-bit DAC (I²C)':
    'WHAT: turns a number into a precise voltage (0–3.3 V). Two of them set the pulse amplitude.\nCHECK: "MCP4725A0" gives addresses 0x60 and 0x61 (the A0 pin low/high). "A1" gives 0x62/0x63 and "A2" 0x64/0x65: acceptable but tell me, the firmware address changes. 12-bit, I²C, package SOT-23-6 (suffix /CH), supply 2.7–5.5 V.',
  'TL072 dual op-amp':
    'WHAT: two amplifiers that raise the DAC voltages to the pulse levels.\nCHECK: dual "TL072" (TL071 is single, wrong), supply range up to ±18 V (36 V total; we use 17 V), SOIC-8, pins: 4 V−, 8 V+. Output reaches about 1.5 V short of the supplies.',
  '4052 analog multiplexer, 4-channel':
    'WHAT: an electronic selector that connects one of several voltages to the output. It creates the trigger pulse by switching between +level, −level and ground.\nCHECK: a "4052B" (HEF4052B / CD4052B): dual 4-channel, with a separate negative supply pin VEE (pin 7) so the signals can go below ground. The 15 V rating on the Reichelt page is the limit that matters: VDD − VEE must stay at or below 15 V (we use +9 V and −5 V = 14 V; the first design had 17 V, which was wrong). The 74HC4052 is NOT suitable (supply limit about 10 V). Package SO-16. It is the 4052 (dual 4:1), not the 4051 (8:1) or 4053 (triple 2:1). Check the logic-high level at 9 V supply in the datasheet (about 6–7 V): our control lines swing to MUX_VDD (9 V).',
  'Voltage regulator 78L05':
    'WHAT: makes a steady 5 V from the 12 V rail (100 mA).\nCHECK: "L78L05" = 5 V (78L09 = 9 V, 79L05 = negative, LM317 = adjustable: all wrong). Maximum input ≥ 16 V (the part allows about 30 V), output 4.8–5.2 V, 100 mA. TO-92 package. WARNING: the TO-92 pin order of this regulator (output, ground, input) differs from a 2N7000: use the datasheet.',
  'Voltage regulator 78L09': 'WHAT: makes a steady 9 V from the 12 V rail (100 mA) for the multiplexer.\nCHECK: "L78L09" = 9 V (not 78L05 or 78L12), input maximum ≥ 16 V, TO-92. WARNING: the TO-92 pin order of the 78Lxx (output, ground, input) differs from a 2N7000: use the datasheet.',
  'LDO 3.3 V':
    'WHAT: makes 3.3 V from the 5 V for the 12 V-side logic.\nCHECK: fixed 3.3 V version ("-3.3"), maximum input voltage at least 5.5 V (AP2112K and MCP1700 allow about 6 V: do NOT feed them 12 V), current ≥ 100 mA, package SOT-23-5 (AP2112K) or SOT-23 (MCP1700). Pin order differs between the two: check the footprint.',
  'Charge-pump inverter ICL7660S':
    'WHAT: turns +5 V into about −5 V using two capacitors, to supply the negative side of the op-amp and multiplexer.\nCHECK: ICL7660S ("S" = the improved version): input 1.5–12 V (we feed 5 V; the optional ±9 V version also fits), output current 45 mA (we need about 5 mA). Package DIP-8 (suffix CPA = plastic DIP, commercial temperature). Pins: 1 BOOST (leave open), 2 CAP+, 3 GND, 4 CAP−, 5 VOUT, 6 LV (leave open above 3.5 V), 7 OSC (leave open), 8 V+. Needs two 10 µF capacitors (pump and reservoir). The plain ICL7660 (10 V limit) and the TC7660 / MAX1044 are compatible alternatives.',
  'IC socket DIP-8': 'WHAT: a socket so the charge pump can be replaced. CHECK: 8 pins, narrow (7.62 mm between the rows).',
  'TVS diode, bidirectional, 15 V':
    'WHAT: protects the trigger output from spikes. CHECK: "SMAJ15CA" = bidirectional, stand-off 15 V (does not conduct at the −3.3 … +10 V pulse levels), package SMA.',
  'Schottky diode BAT54': 'WHAT: a small fast diode (optional peak hold). CHECK: single diode "BAT54" (not S/A/C), SOT-23, forward voltage about 0.3 V.',
  'Schottky diode 1N5819': 'WHAT: a Schottky rectifier. CHECK: 1 A, 40 V, band = cathode, DO-41. Used for the optional VSYS supply and as an alternative clamp diode.',
  'Female header 1×20, 2.54 mm': 'WHAT: the sockets the Pico plugs into.\nCHECK: 1×20 female, 2.54 mm pitch, through-hole, two pieces. The rows must be 17.78 mm apart on the board (the Pico\'s width). Choose a long-pin or standard version that matches the Pico\'s male pins.',
  'PCB terminal block, 2-pole, 5.08 mm': 'WHAT: screw terminals for the wires.\nCHECK: pitch exactly 5.08 mm (not 3.5, 3.81 or 7.5 mm), 2 poles, rated ≥ 10 A, wire entry from the side, through-hole. Match the footprint drawing (pin diameter, drill, spacing). Poles can be ganged: 3-pole and 4-pole versions must also be 5.08 mm.',
  'PCB terminal block, 3-pole, 5.08 mm': 'Same as the 2-pole one: pitch 5.08 mm, 3 poles, ≥ 10 A, side entry.',
  'PCB terminal block, 4-pole, 5.08 mm': 'Same as the 2-pole one: pitch 5.08 mm, 4 poles, ≥ 10 A, side entry.',
  'IC socket DIP-28, narrow (0.3")': 'WHAT: a socket so the expander can be replaced. CHECK: 28 pins, NARROW (7.62 mm / 0.3 inch between the rows), not the wide 15.24 mm (0.6 inch) one.',
  'PCB, 2-layer, 1.6 mm': 'WHAT: the bare circuit board. CHECK on the JLCPCB order page: 2 layers, 1.6 mm, 1 oz copper, lead-free HASL, minimum 5 pieces, DHL express. The isolation slot is drawn as a routed slot in the outline layer.',
  'Capacitor 100 nF, 0805, X7R, 50 V': 'WHAT: decoupling next to each chip. CHECK: 100 nF, voltage ≥ 25 V, dielectric X7R (or X5R), not Y5V/Z5U, size 0805 (2.0 × 1.25 mm).',
  'Capacitor 1 µF, 0805, X7R/X5R, 16 V': 'CHECK: 1 µF, ≥ 16 V, X7R or X5R, 0805.',
  'Capacitor 10 µF, 1206/0805, X5R, ≥ 16 V': 'CHECK: 10 µF, ≥ 16 V (the DC-bias derating of ceramics is large, so 25 V is better), X5R/X7R, 1206 or 0805 to match the footprint.',
};
export const GENERIC = [
  [/^Resistor/, 'CHECK: value, tolerance as listed, size 0805 (2.0 × 1.25 mm) unless it says axial. Compare the colour/marking code, or the E-series value.'],
  [/^Capacitor/, 'CHECK: value, voltage ≥ 25 V, dielectric X7R/X5R, 0805.'],
  [/^Pin header|^Female header/, 'CHECK: 2.54 mm pitch, number of pins, through-hole.'],
];
