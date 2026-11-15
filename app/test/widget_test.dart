import 'package:coil_tester/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('app starts on the connect screen with the AP default address', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const CoilTesterApp());
    await tester.pumpAndSettle();

    expect(find.text('Coil Tester'), findsOneWidget);
    expect(find.widgetWithText(TextField, '192.168.4.1'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Connect'), findsOneWidget);
  });

  testWidgets('remembers the last tester address', (tester) async {
    SharedPreferences.setMockInitialValues({'tester_host': '192.168.1.50'});
    await tester.pumpWidget(const CoilTesterApp());
    await tester.pumpAndSettle();

    expect(find.widgetWithText(TextField, '192.168.1.50'), findsOneWidget);
  });
}
