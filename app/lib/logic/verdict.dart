import '../data/coil_specs.dart';
import '../models/resistance_result.dart';

enum Verdict { pass, low, high, open, short, error }

extension VerdictLabel on Verdict {
  String get label => switch (this) {
        Verdict.pass => 'PASS',
        Verdict.low => 'FAIL · LOW',
        Verdict.high => 'FAIL · HIGH',
        Verdict.open => 'FAIL · OPEN',
        Verdict.short => 'FAIL · SHORT',
        Verdict.error => 'CHECK SETUP',
      };

  bool get isPass => this == Verdict.pass;
}

/// Compare a measurement against a spec range.
Verdict judgeResistance(ResistanceResult r, CoilSpec spec) {
  switch (r.status) {
    case 'open':
    case 'over_range':
      return Verdict.open;
    case 'short':
      return Verdict.short;
    case 'ok':
      final ohms = r.ohms!;
      if (ohms < spec.minOhms) return Verdict.low;
      if (ohms > spec.maxOhms) return Verdict.high;
      return Verdict.pass;
    default:
      return Verdict.error;
  }
}

/// Human-friendly resistance: 0.42 Ω, 152.3 Ω, 4.70 kΩ, 47.0 kΩ.
String formatOhms(double? ohms) {
  if (ohms == null) return '—';
  if (ohms >= 1000) {
    final k = ohms / 1000;
    return '${k.toStringAsFixed(k >= 100 ? 0 : (k >= 10 ? 1 : 2))} kΩ';
  }
  return '${ohms.toStringAsFixed(ohms >= 100 ? 1 : 2)} Ω';
}
