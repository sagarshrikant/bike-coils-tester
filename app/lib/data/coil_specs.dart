/// Resistance spec presets. These are TYPICAL ranges only; the user should edit them to match the
/// service manual for the bike being tested (see docs/test-plan.md).
class CoilSpec {
  final String id; // test ID from docs/test-plan.md
  final String name;
  final double minOhms;
  final double maxOhms;
  final String hint;

  const CoilSpec({
    required this.id,
    required this.name,
    required this.minOhms,
    required this.maxOhms,
    required this.hint,
  });

  CoilSpec copyWith({double? minOhms, double? maxOhms}) => CoilSpec(
        id: id,
        name: name,
        minOhms: minOhms ?? this.minOhms,
        maxOhms: maxOhms ?? this.maxOhms,
        hint: hint,
      );
}

const coilSpecPresets = <CoilSpec>[
  CoilSpec(
    id: 'P1',
    name: 'Pickup / pulser coil',
    minOhms: 80,
    maxOhms: 250,
    hint: 'Unplug from the CDI. Clip across the two pickup wires (or wire to ground).',
  ),
  CoilSpec(
    id: 'S1',
    name: 'AC-CDI exciter / source coil',
    minOhms: 100,
    maxOhms: 800,
    hint: 'Engine off, CDI unplugged. Clip across the exciter coil wires.',
  ),
  CoilSpec(
    id: 'I2',
    name: 'Ignition coil secondary (no plug cap)',
    minOhms: 3000,
    maxOhms: 15000,
    hint: 'Remove the plug cap. Clip between the HT lead core and the coil ground/primary (-).',
  ),
  CoilSpec(
    id: 'I2c',
    name: 'Ignition coil secondary (with resistive cap)',
    minOhms: 7000,
    maxOhms: 20000,
    hint: 'Clip between the plug-cap terminal and the coil ground.',
  ),
];
