# CLAUDE.md — Bike Coils Tester

A bench tool for testing motorcycle **pickup (pulser) coils**, **CDI units (AC and DC)** and
**ignition coils**. Each one can be tested on its own, or the whole chain can be tested together
(pickup → CDI → coil → spark). The hardware is a **Raspberry Pi Pico W** plus analog front-end
circuits. It sends data over **Wi-Fi (now)** or **BLE (later)** to a **Flutter app**
(Android / iOS / Web), which shows live values and builds test reports.

The circuits are prototyped on general-purpose perfboard first. A custom PCB (KiCad) comes later.

## Repository layout

```
docs/                 Plans and specs (read these before designing anything)
  safety.md           HV rules: READ FIRST
  test-plan.md        What we measure for each unit and for the chain, with pass/fail criteria
  architecture.md     System architecture, measurement channels, data protocol
  roadmap.md          Phased plan; the current phase is marked
  decisions.md        Decision log (ADR-style). Add an entry for every design decision
hardware/
  bom.md              Components, all commonly available parts
  circuits/           One markdown file per circuit block (schematic, values, perfboard notes)
  diagrams/           *.drawio.svg: editable in draw.io AND viewable as plain SVG
firmware/             MicroPython for Pico W
  src/                Files copied to the Pico filesystem
  tests/              Host-side tests (CPython) for the pure logic
app/                  Flutter app (coil_tester)
tools/drawio/         Generator used to create NEW draw.io SVG diagrams
.claude/skills/       Project skills, one per subsystem once its design is agreed
```

## Hardware on hand

The user has Pico boards, a **known-good pickup coil, AC-CDI and DC-CDI**, a soldering station and
general-purpose PCB. There's no ignition coil or bench supply yet (see `hardware/bom.md`). The
known-good parts are **golden references**: their first results are saved as baselines, and later
parts are compared to them. Plan phases around what's on hand first.

## Working rules

- **Safety first.** CDI outputs reach 200–400 V and ignition secondaries reach 20–40 kV. No HV node may
  connect to a Pico pin without a divider, a series resistor and clamp diodes. See `docs/safety.md`.
  Point out HV hazards in every circuit you propose.
- **Work in phases.** Follow `docs/roadmap.md`. Build the simplest working piece, test it on the
  bench, then extend. Don't build ahead of the current phase without asking.
- **Brainstorm, then decide, then build.** When a subsystem's design is agreed with the user:
  1. Record it in `docs/decisions.md`.
  2. Write or update `hardware/circuits/<block>.md`.
  3. Create or update a skill in `.claude/skills/<subsystem>/SKILL.md` that captures how to build,
     test and extend that subsystem.
- **Parts must be easy to get.** Prefer through-hole or SOIC parts available from common hobby
  suppliers (e.g. LM358, TL072, LM393, ADS1115 module, BAT54S, 1N4148, IRLZ44N, 6N137).
  Put every new part in `hardware/bom.md`.
- **Pin map single source of truth:** `firmware/src/hw_pins.py`. Keep `docs/architecture.md`
  (pin table) in sync with it.

## Diagrams

- Every diagram is a `*.drawio.svg` in `hardware/diagrams/`. The file is a normal SVG with the
  draw.io model embedded, so the user can open and edit it directly in draw.io (desktop or
  app.diagrams.net).
- Once a diagram exists, **the .drawio.svg file is the source of truth.** Do not regenerate it with
  the generator; the user may have edited it. Make changes by editing the file, or ask the user to
  edit it in draw.io.
- To create a new diagram, follow the `drawio-diagram` skill (`tools/drawio/`).

## Firmware (MicroPython, Pico W)

- Code lives in `firmware/src/`. Hardware access (`machine`, `network`) stays in thin wrappers.
  Measurement math stays pure, so `firmware/tests/` can run it on the host with CPython.
- Run host tests: `python3 firmware/tests/run_tests.py`
- Deploy: `mpremote connect auto fs cp -r firmware/src/. :` then `mpremote reset`
- Wi-Fi credentials go in `firmware/src/wifi_config.py` (gitignored). The template is
  `wifi_config.example.py`.
- HTTP JSON API is versioned under `/api/v1/`. Keys are snake_case and carry their unit:
  `ohms`, `v_top`, `t_ms`, `rpm`.
  Changing the API means updating `docs/architecture.md` and `app/lib/api/` in the same change.

## App (Flutter)

- Project in `app/` (package `coil_tester`, org `com.bikecoils`). Platform folders (android, ios,
  web) are committed. The Android manifest and iOS Info.plist carry the plain-HTTP/local-network
  settings; keep them if you regenerate.
- Structure: `lib/api/` (device client), `lib/models/`, `lib/logic/` (pure, unit tested),
  `lib/data/` (coil spec presets), `lib/screens/`.
- Commands: `flutter pub get`, `flutter test`, `flutter run`.

## Environment notes

- The user runs Flutter on the host; `app/.dart_tool` and `app/pubspec.lock` belong to the host SDK.
  To test the app in the container, copy `lib/ test/ pubspec.yaml` to the scratchpad and run there.
  Never run `flutter pub get` inside `app/` from the container: it rewrites the host's paths.
- No Pico is attached to the container. Hardware steps run on the user's bench; say so instead of
  claiming they were tested.
- Container uid (1000) differs from the host user. The repo has a default ACL so files stay
  writable from both sides.
