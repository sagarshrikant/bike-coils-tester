# Roadmap

Each phase ends with a **bench test that passes** before the next one starts. ▶ marks the current phase.

**On hand (2026-11-15):** Pico boards, known-good pickup coil, known-good AC-CDI and DC-CDI,
soldering station, general-purpose PCB. The phase order uses these first. Their results become
**golden baselines**.
**To acquire before Phase 3:** a known-good ignition coil + spark gap/plug, and a current-limited
12 V supply. A CDI must never be fired without a load.

| Phase | Goal | Hardware | Firmware / App | Exit test |
|---|---|---|---|---|
| 0 | Project skeleton | — | Repo, docs, diagrams, toolchains installed | `flutter doctor` OK, MicroPython runs on the Pico W |
| ▶ 1 | **Wi-Fi link + 2-wire resistance (P1, P2, I2)** | Pico W on perfboard, CH-R2 divider | HTTP API, app: connect + resistance screen with PASS/FAIL | Known resistors within ± 2 %; **golden pickup coil** measured from the phone and saved as its baseline |
| 2 | Pickup dynamic (P4–P6) | CH-PU input (±100 V divider + comparator), analog mux. Flick test first; a drill/motor-spun steel tab later | PIO edge capture, WebSocket waveform stream, app waveform chart | Golden pickup waveform captured (flick + spun), Vpeak and polarity shown |
| 3 | DC-CDI test (C1–C6) | CH-TG trigger generator, CH-HV divider + peak detect, CH-I; ignition coil + enclosed gap as load | Trigger sequencer, RPM sweep, advance curve, app chart | **Golden DC-CDI** advance curve + output saved as its baseline |
| 4 | Low-ohm 4-wire + insulation (I1, P3, I3) | LM317 CC source, ADS1115, HV leakage module | API + app screens | 0.22 Ω / 1 Ω / 4.7 Ω within ± 3 % |
| 5 | Ignition coil dynamic (I4–I7) | DRV IGBT driver, CH-SP spark detector, spark gap box | Dwell control, burn-time measurement | Spark detection 100 % at 1000–6000 RPM |
| 6 | Chain test + reports (X1–X6) | All modules on a common backplane | Chain sequencer, fault localisation, PDF reports, history | Each injected fault (pickup open, CDI dead, coil open) correctly located |
| 7 | AC-CDI + BLE | HV AC source (separate safety review); the golden AC-CDI is the reference | BLE GATT transport | Golden AC-CDI baseline saved |
| 8 | Custom PCB | KiCad schematic + layout from the proven perfboard circuits | — | PCB passes all phase tests |

## Phase 1 task list

- [x] Docs: safety, test plan, architecture, roadmap, decisions, BOM
- [x] System block diagram + CH-R2 wiring diagram (.drawio.svg)
- [x] Firmware: Wi-Fi AP/STA, HTTP server, resistance meter, lead-zero calibration
- [x] Host tests for the resistance maths and API
- [x] Flutter app: connect screen, resistance screen, spec presets, PASS/FAIL, session list
- [ ] **User:** confirm the Pico boards are **Pico W** (Wi-Fi chip under a metal shield, near
      the antenna end). A plain Pico has no Wi-Fi and would need an ESP module or a USB link.
- [ ] **User:** install the MicroPython UF2 on the Pico W, deploy the firmware, open `http://192.168.4.1/`
- [ ] **User:** build CH-R2 on perfboard (`hardware/circuits/ch-r2-resistance.md`)
- [ ] **User:** `flutter create` the platform folders, run the app, connect
- [ ] Bench test with known resistors + the golden pickup coil → record in `docs/test-results/phase1.md`
- [ ] App: save a measurement as a part's baseline (golden reference)
- [ ] Write skill `.claude/skills/resistance-meter/` once Phase 1 is confirmed working
