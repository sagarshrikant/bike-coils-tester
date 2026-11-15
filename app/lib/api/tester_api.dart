import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/resistance_result.dart';

class TesterApiException implements Exception {
  final String message;
  TesterApiException(this.message);
  @override
  String toString() => message;
}

/// HTTP client for the Pico W tester (API: docs/architecture.md, /api/v1).
class TesterApi {
  final Uri base;
  final http.Client _client;
  static const timeout = Duration(seconds: 6);

  TesterApi(String host, {http.Client? client})
      : base = Uri.parse(host.contains('://') ? host : 'http://$host'),
        _client = client ?? http.Client();

  Future<Map<String, dynamic>> _call(String method, String path,
      [Map<String, String>? query]) async {
    final uri = base.replace(path: path, queryParameters: query);
    final http.Response res;
    try {
      res = await (method == 'POST' ? _client.post(uri) : _client.get(uri))
          .timeout(timeout);
    } catch (e) {
      throw TesterApiException('Cannot reach tester at ${base.host}: $e');
    }
    final Map<String, dynamic> body;
    try {
      body = jsonDecode(res.body) as Map<String, dynamic>;
    } on FormatException {
      throw TesterApiException('Bad response (${res.statusCode})');
    }
    if (res.statusCode != 200 || body['ok'] != true) {
      throw TesterApiException(body['error']?.toString() ?? 'HTTP ${res.statusCode}');
    }
    return body;
  }

  Future<DeviceInfo> info() async =>
      DeviceInfo.fromJson(await _call('GET', '/api/v1/info'));

  Future<ResistanceResult> measureResistance({String range = 'auto'}) async =>
      ResistanceResult.fromJson(
          await _call('GET', '/api/v1/resistance', {'range': range}));

  Future<double> calibrateZero() async =>
      ((await _call('POST', '/api/v1/calibrate/zero'))['lead_ohms'] as num)
          .toDouble();

  void close() => _client.close();
}
