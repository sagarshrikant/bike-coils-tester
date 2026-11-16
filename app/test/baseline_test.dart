import 'package:coil_tester/data/baseline_store.dart';
import 'package:coil_tester/logic/baseline_compare.dart';
import 'package:coil_tester/models/baseline.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

Baseline golden(double ohms) =>
    Baseline(specId: 'P1', ohms: ohms, range: '1k', savedAt: DateTime.utc(2026, 11, 16, 9, 30));

void main() {
  group('compareToBaseline', () {
    test('within tolerance, both directions', () {
      final c = compareToBaseline(512, golden(500));
      expect(c.isWithin, isTrue);
      expect(c.deviationPct, closeTo(2.4, 0.001));
      expect(compareToBaseline(480, golden(500)).isWithin, isTrue);
    });

    test('flags high and low outside the tolerance', () {
      expect(compareToBaseline(540, golden(500)).state, BaselineState.high);
      expect(compareToBaseline(450, golden(500)).state, BaselineState.low);
    });

    test('a custom tolerance is respected', () {
      expect(compareToBaseline(512, golden(500), tolerancePct: 2).state, BaselineState.high);
    });

    test('formats the deviation with a sign', () {
      expect(formatDeviation(1.234), '+1.2 %');
      expect(formatDeviation(-3.46), '-3.5 %');
      expect(formatDeviation(0), '+0.0 %');
    });
  });

  group('Baseline JSON', () {
    test('round trips', () {
      final b = golden(508.66);
      final back = Baseline.fromJson(b.toJson());
      expect(back.specId, 'P1');
      expect(back.ohms, 508.66);
      expect(back.range, '1k');
      expect(back.savedAt.toUtc(), b.savedAt.toUtc());
    });
  });

  group('stores', () {
    test('memory store saves, replaces and clears per spec id', () async {
      final s = MemoryBaselineStore();
      expect(await s.load('P1'), isNull);
      await s.save(golden(500));
      expect((await s.load('P1'))!.ohms, 500);
      await s.save(golden(510));
      expect((await s.load('P1'))!.ohms, 510);
      expect(await s.load('S1'), isNull);
      await s.clear('P1');
      expect(await s.load('P1'), isNull);
    });

    test('prefs store persists and survives a corrupted entry', () async {
      SharedPreferences.setMockInitialValues({});
      final s = PrefsBaselineStore();
      expect(await s.load('P1'), isNull);
      await s.save(golden(508.66));
      expect((await s.load('P1'))!.ohms, 508.66);

      SharedPreferences.setMockInitialValues({'baseline.P1': 'not json'});
      expect(await PrefsBaselineStore().load('P1'), isNull);

      await s.clear('P1');
      expect(await s.load('P1'), isNull);
    });
  });
}
