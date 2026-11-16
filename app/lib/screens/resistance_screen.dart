import 'package:flutter/material.dart';

import '../api/tester_api.dart';
import '../data/baseline_store.dart';
import '../data/coil_specs.dart';
import '../logic/baseline_compare.dart';
import '../logic/verdict.dart';
import '../models/baseline.dart';
import '../models/resistance_result.dart';

class _Entry {
  final CoilSpec spec;
  final ResistanceResult result;
  final Verdict verdict;
  _Entry(this.spec, this.result, this.verdict);
}

/// Phase 1 test screen: pick a coil type, measure, PASS/FAIL, session log.
class ResistanceScreen extends StatefulWidget {
  final TesterApi api;
  final DeviceInfo info;
  final BaselineStore? store; // defaults to on-device storage; tests inject a memory store
  const ResistanceScreen({super.key, required this.api, required this.info, this.store});

  @override
  State<ResistanceScreen> createState() => _ResistanceScreenState();
}

class _ResistanceScreenState extends State<ResistanceScreen> {
  late CoilSpec _spec = coilSpecPresets.first;
  ResistanceResult? _last;
  Verdict? _verdict;
  bool _busy = false;
  late double _leadOhms = widget.info.leadOhms;
  final _log = <_Entry>[];
  late final BaselineStore _store = widget.store ?? PrefsBaselineStore();
  Baseline? _baseline;

  @override
  void initState() {
    super.initState();
    _loadBaseline();
  }

  Future<void> _loadBaseline() async {
    final id = _spec.id;
    final b = await _store.load(id);
    if (mounted && id == _spec.id) setState(() => _baseline = b);
  }

  bool get _canSaveBaseline =>
      !_busy && _last != null && _last!.status == 'ok' && (_last!.ohms ?? 0) > 0;

  Future<void> _saveBaseline() async {
    final r = _last;
    if (r == null || r.ohms == null) return;
    if (_baseline != null) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Replace baseline?'),
          content: Text('${_spec.id} already has a baseline of ${formatOhms(_baseline!.ohms)}. '
              'Replace it with ${formatOhms(r.ohms)}?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Replace')),
          ],
        ),
      );
      if (ok != true) return;
    }
    final b = Baseline(specId: _spec.id, ohms: r.ohms!, range: r.range, savedAt: DateTime.now());
    await _store.save(b);
    if (!mounted) return;
    setState(() => _baseline = b);
    ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Baseline saved: ${_spec.id} ${formatOhms(b.ohms)}')));
  }

  Future<void> _clearBaseline() async {
    await _store.clear(_spec.id);
    if (mounted) setState(() => _baseline = null);
  }

  String _formatDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Future<void> _run(Future<void> Function() action) async {
    setState(() => _busy = true);
    try {
      await action();
    } on TesterApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _measure() => _run(() async {
        final r = await widget.api.measureResistance();
        final v = judgeResistance(r, _spec);
        setState(() {
          _last = r;
          _verdict = v;
          _log.insert(0, _Entry(_spec, r, v));
        });
      });

  Future<void> _zero() => _run(() async {
        final lead = await widget.api.calibrateZero();
        setState(() => _leadOhms = lead);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Lead resistance ${formatOhms(lead)} stored')));
        }
      });

  Future<void> _editLimits() async {
    final minC = TextEditingController(text: _spec.minOhms.toStringAsFixed(0));
    final maxC = TextEditingController(text: _spec.maxOhms.toStringAsFixed(0));
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Limits: ${_spec.name}'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(
              controller: minC,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Min Ω')),
          TextField(
              controller: maxC,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Max Ω')),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save')),
        ],
      ),
    );
    final lo = double.tryParse(minC.text), hi = double.tryParse(maxC.text);
    if (ok == true && lo != null && hi != null && lo < hi) {
      setState(() => _spec = _spec.copyWith(minOhms: lo, maxOhms: hi));
    }
  }

  Widget _baselineChip(Baseline b, double ohms) {
    final c = compareToBaseline(ohms, b);
    final word = c.isWithin
        ? 'within tolerance'
        : (c.state == BaselineState.high ? 'ABOVE baseline' : 'BELOW baseline');
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Chip(
        label: Text('vs baseline ${formatOhms(b.ohms)}: ${formatDeviation(c.deviationPct)} · $word',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: c.isWithin ? Colors.green.shade600 : Colors.orange.shade800,
      ),
    );
  }

  Color _verdictColor(Verdict v) => v.isPass ? Colors.green.shade600 : Colors.red.shade600;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Coil resistance'),
        actions: [
          Center(
              child: Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Text('fw ${widget.info.fwVersion} · ${widget.info.ip}', style: t.bodySmall),
          )),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          DropdownButtonFormField<String>(
            initialValue: _spec.id,
            decoration: const InputDecoration(labelText: 'Part under test', border: OutlineInputBorder()),
            items: [
              for (final s in coilSpecPresets)
                DropdownMenuItem(value: s.id, child: Text('${s.id}  ${s.name}')),
            ],
            onChanged: (id) => setState(() {
              _spec = coilSpecPresets.firstWhere((s) => s.id == id);
              _last = null;
              _verdict = null;
              _baseline = null;
              _loadBaseline();
            }),
          ),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(
                child: Text(
                    'Limits ${formatOhms(_spec.minOhms)} – ${formatOhms(_spec.maxOhms)}',
                    style: t.bodyMedium)),
            TextButton.icon(onPressed: _editLimits, icon: const Icon(Icons.edit, size: 18), label: const Text('Edit')),
          ]),
          Text(_spec.hint, style: t.bodySmall),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(children: [
                Text(_last == null ? '—' : (_last!.status == 'ok' ? formatOhms(_last!.ohms) : _last!.status.toUpperCase()),
                    style: t.displayMedium),
                const SizedBox(height: 8),
                if (_verdict != null)
                  Chip(
                    label: Text(_verdict!.label,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    backgroundColor: _verdictColor(_verdict!),
                  ),
                if (_baseline != null && _last != null && _last!.status == 'ok' && _last!.ohms != null)
                  _baselineChip(_baseline!, _last!.ohms!),
                if (_last != null)
                  Text('range ${_last!.range} · V_top ${_last!.vTop.toStringAsFixed(3)} V · '
                      'V_node ${_last!.vNode.toStringAsFixed(3)} V',
                      style: t.bodySmall),
              ]),
            ),
          ),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(
              child: FilledButton.icon(
                onPressed: _busy ? null : _measure,
                icon: const Icon(Icons.speed),
                label: const Text('Measure'),
              ),
            ),
            const SizedBox(width: 12),
            OutlinedButton(
              onPressed: _busy ? null : _zero,
              child: Text('Zero leads (${formatOhms(_leadOhms)})'),
            ),
          ]),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _canSaveBaseline ? _saveBaseline : null,
                icon: const Icon(Icons.star_outline),
                label: Text('Save as baseline (${_spec.id})'),
              ),
            ),
          ]),
          if (_baseline != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(children: [
                Expanded(
                    child: Text(
                        'Baseline ${formatOhms(_baseline!.ohms)} · saved ${_formatDate(_baseline!.savedAt)} · '
                        'tolerance ±${defaultBaselineTolerancePct.toStringAsFixed(0)} %',
                        style: t.bodySmall)),
                IconButton(
                    tooltip: 'Clear baseline',
                    onPressed: _clearBaseline,
                    icon: const Icon(Icons.delete_outline, size: 20)),
              ]),
            ),
          if (_busy) const Padding(padding: EdgeInsets.only(top: 12), child: LinearProgressIndicator()),
          const SizedBox(height: 24),
          if (_log.isNotEmpty) Text('This session', style: t.titleMedium),
          for (final e in _log)
            ListTile(
              dense: true,
              leading: Icon(e.verdict.isPass ? Icons.check_circle : Icons.cancel,
                  color: _verdictColor(e.verdict)),
              title: Text('${e.spec.id}  ${e.result.status == 'ok' ? formatOhms(e.result.ohms) : e.result.status.toUpperCase()}'),
              subtitle: Text('${e.verdict.label} · limits ${formatOhms(e.spec.minOhms)}–${formatOhms(e.spec.maxOhms)}'),
              trailing: Text(TimeOfDay.fromDateTime(e.result.receivedAt).format(context)),
            ),
        ],
      ),
    );
  }
}
