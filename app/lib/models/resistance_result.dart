/// One CH-R2 resistance measurement, as returned by GET /api/v1/resistance.
class ResistanceResult {
  final String status; // ok | open | short | over_range | fault
  final double? ohms;
  final double? rawOhms;
  final String range;
  final double vTop;
  final double vNode;
  final double leadOhms;
  final DateTime receivedAt;

  ResistanceResult({
    required this.status,
    required this.ohms,
    required this.rawOhms,
    required this.range,
    required this.vTop,
    required this.vNode,
    required this.leadOhms,
    DateTime? receivedAt,
  }) : receivedAt = receivedAt ?? DateTime.now();

  factory ResistanceResult.fromJson(Map<String, dynamic> j) => ResistanceResult(
        status: j['status'] as String,
        ohms: (j['ohms'] as num?)?.toDouble(),
        rawOhms: (j['raw_ohms'] as num?)?.toDouble(),
        range: j['range'] as String,
        vTop: (j['v_top'] as num).toDouble(),
        vNode: (j['v_node'] as num).toDouble(),
        leadOhms: (j['lead_ohms'] as num? ?? 0).toDouble(),
      );
}

class DeviceInfo {
  final String fwVersion;
  final String ip;
  final String mode;
  final int uptimeS;
  final double leadOhms;

  DeviceInfo({
    required this.fwVersion,
    required this.ip,
    required this.mode,
    required this.uptimeS,
    required this.leadOhms,
  });

  factory DeviceInfo.fromJson(Map<String, dynamic> j) => DeviceInfo(
        fwVersion: j['fw_version'] as String,
        ip: j['ip'] as String? ?? '',
        mode: j['mode'] as String? ?? '',
        uptimeS: (j['uptime_s'] as num? ?? 0).toInt(),
        leadOhms: (j['lead_ohms'] as num? ?? 0).toDouble(),
      );
}
