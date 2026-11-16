import '../models/baseline.dart';

/// Default allowed deviation from the golden reading, in percent. Comfortably wider than the
/// Phase 1 meter accuracy (about 1-3 %), so a good part passes.
const double defaultBaselineTolerancePct = 5.0;

enum BaselineState { within, high, low }

class BaselineComparison {
  final double deviationPct; // + = reading is above the baseline
  final BaselineState state;
  const BaselineComparison(this.deviationPct, this.state);

  bool get isWithin => state == BaselineState.within;
}

/// Compare a lead-corrected reading with a saved baseline.
BaselineComparison compareToBaseline(
  double ohms,
  Baseline baseline, {
  double tolerancePct = defaultBaselineTolerancePct,
}) {
  final dev = (ohms - baseline.ohms) / baseline.ohms * 100;
  final state = dev > tolerancePct
      ? BaselineState.high
      : dev < -tolerancePct
          ? BaselineState.low
          : BaselineState.within;
  return BaselineComparison(dev, state);
}

/// "+1.2 %" / "-3.4 %"
String formatDeviation(double pct) => '${pct >= 0 ? '+' : '-'}${pct.abs().toStringAsFixed(1)} %';
