import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/baseline.dart';

/// Where golden baselines live. Today: on this device/browser (see docs/decisions.md D7).
/// A device-side store (on the Pico) can implement the same interface later.
abstract class BaselineStore {
  Future<Baseline?> load(String specId);
  Future<void> save(Baseline baseline);
  Future<void> clear(String specId);
}

class PrefsBaselineStore implements BaselineStore {
  static String _key(String specId) => 'baseline.$specId';

  @override
  Future<Baseline?> load(String specId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key(specId));
    if (raw == null) return null;
    try {
      return Baseline.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null; // corrupted entry: treat as no baseline
    }
  }

  @override
  Future<void> save(Baseline baseline) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key(baseline.specId), jsonEncode(baseline.toJson()));
  }

  @override
  Future<void> clear(String specId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key(specId));
  }
}

/// In-memory store for tests.
class MemoryBaselineStore implements BaselineStore {
  final _items = <String, Baseline>{};

  @override
  Future<Baseline?> load(String specId) async => _items[specId];

  @override
  Future<void> save(Baseline baseline) async => _items[baseline.specId] = baseline;

  @override
  Future<void> clear(String specId) async => _items.remove(specId);
}
