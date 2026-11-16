/// A saved "golden" resistance for one part type (test ID from docs/test-plan.md, e.g. P1).
/// Later parts are compared against it.
class Baseline {
  final String specId;
  final double ohms; // lead-corrected, as shown on screen
  final String range; // 1k | 10k
  final DateTime savedAt;

  const Baseline({
    required this.specId,
    required this.ohms,
    required this.range,
    required this.savedAt,
  });

  Map<String, dynamic> toJson() => {
        'spec_id': specId,
        'ohms': ohms,
        'range': range,
        'saved_at': savedAt.toUtc().toIso8601String(),
      };

  factory Baseline.fromJson(Map<String, dynamic> j) => Baseline(
        specId: j['spec_id'] as String,
        ohms: (j['ohms'] as num).toDouble(),
        range: j['range'] as String? ?? '',
        savedAt: DateTime.parse(j['saved_at'] as String).toLocal(),
      );
}
