import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/tester_api.dart';
import 'resistance_screen.dart';

/// Enter the tester's address and connect. Default 192.168.4.1 = the Pico's own Wi-Fi (AP mode).
class ConnectScreen extends StatefulWidget {
  const ConnectScreen({super.key});

  @override
  State<ConnectScreen> createState() => _ConnectScreenState();
}

class _ConnectScreenState extends State<ConnectScreen> {
  static const _prefKey = 'tester_host';
  final _host = TextEditingController(text: '192.168.4.1');
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    SharedPreferences.getInstance().then((p) {
      final saved = p.getString(_prefKey);
      if (saved != null && mounted) setState(() => _host.text = saved);
    });
  }

  Future<void> _connect() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final api = TesterApi(_host.text.trim());
    try {
      final info = await api.info();
      (await SharedPreferences.getInstance()).setString(_prefKey, _host.text.trim());
      if (!mounted) return;
      await Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => ResistanceScreen(api: api, info: info)));
    } on TesterApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Coil Tester')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Connect your phone to the Wi-Fi network "CoilTester" '
            '(or the same network as the tester), then connect.',
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _host,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(
                labelText: 'Tester address', border: OutlineInputBorder()),
            onSubmitted: (_) => _connect(),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _busy ? null : _connect,
            icon: _busy
                ? const SizedBox.square(
                    dimension: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.wifi),
            label: const Text('Connect'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
        ],
      ),
    );
  }
}
