import 'package:flutter/material.dart';

import 'screens/connect_screen.dart';

void main() => runApp(const CoilTesterApp());

class CoilTesterApp extends StatelessWidget {
  const CoilTesterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Coil Tester',
      theme: ThemeData(colorSchemeSeed: Colors.indigo, useMaterial3: true),
      darkTheme: ThemeData(
          colorSchemeSeed: Colors.indigo,
          brightness: Brightness.dark,
          useMaterial3: true),
      home: const ConnectScreen(),
    );
  }
}
