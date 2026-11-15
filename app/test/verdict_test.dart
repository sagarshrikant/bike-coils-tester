import 'package:coil_tester/data/coil_specs.dart';
import 'package:coil_tester/logic/verdict.dart';
import 'package:coil_tester/models/resistance_result.dart';
import 'package:flutter_test/flutter_test.dart';

ResistanceResult r(String status, double? ohms) => ResistanceResult(
    status: status, ohms: ohms, rawOhms: ohms, range: '1k', vTop: 3.2, vNode: 0.4, leadOhms: 0);

void main() {
  const pickup = CoilSpec(id: 'P1', name: 'pickup', minOhms: 80, maxOhms: 250, hint: '');

  test('judges against limits', () {
    expect(judgeResistance(r('ok', 150), pickup), Verdict.pass);
    expect(judgeResistance(r('ok', 50), pickup), Verdict.low);
    expect(judgeResistance(r('ok', 400), pickup), Verdict.high);
    expect(judgeResistance(r('open', null), pickup), Verdict.open);
    expect(judgeResistance(r('over_range', 250000), pickup), Verdict.open);
    expect(judgeResistance(r('short', 0.3), pickup), Verdict.short);
    expect(judgeResistance(r('fault', null), pickup), Verdict.error);
  });

  test('parses device JSON', () {
    final res = ResistanceResult.fromJson({
      'ok': true, 'status': 'ok', 'ohms': 152.3, 'raw_ohms': 152.7, 'range': '1k',
      'v_top': 3.212, 'v_node': 0.418, 'lead_ohms': 0.4, 'samples': 64, 't_ms': 1,
    });
    expect(res.ohms, 152.3);
    expect(res.range, '1k');
    final open = ResistanceResult.fromJson({
      'ok': true, 'status': 'open', 'ohms': null, 'raw_ohms': null, 'range': '10k',
      'v_top': 3.29, 'v_node': 3.29, 'lead_ohms': 0,
    });
    expect(open.ohms, isNull);
  });

  test('formats ohms', () {
    expect(formatOhms(0.42), '0.42 Ω');
    expect(formatOhms(152.34), '152.3 Ω');
    expect(formatOhms(4700), '4.70 kΩ');
    expect(formatOhms(47000), '47.0 kΩ');
    expect(formatOhms(150000), '150 kΩ');
    expect(formatOhms(null), '—');
  });
}
