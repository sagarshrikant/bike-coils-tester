# coil_tester — Flutter app

Android, iOS and Web client for the Pico W tester.

## First-time setup

```bash
cd app
flutter pub get
flutter test
```

### Plain HTTP to the tester (already set up)

The tester talks plain `http://` on the local network, which Android and iOS block by default.
These settings are already in the committed platform files. Keep them if you ever regenerate
the platforms with `flutter create`.

**Android:** `android/app/src/main/AndroidManifest.xml`
```xml
<manifest ...>
    <uses-permission android:name="android.permission.INTERNET"/>
    <application
        android:usesCleartextTraffic="true"
        ...>
```

**iOS:** `ios/Runner/Info.plist`, inside the top `<dict>`:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key><true/>
</dict>
<key>NSLocalNetworkUsageDescription</key>
<string>Connects to the coil tester on your local Wi-Fi.</string>
```

**Web:** run it locally over http (`flutter run -d chrome`). A web app served over **https** can't
call the tester's http address (browser mixed-content block). Later the web build can be served
from the Pico itself.

## Run

1. Power the tester and join the phone to the Wi-Fi network **CoilTester** (password from
   `firmware/src/wifi_config.py`). Android may say "no internet": choose *stay connected*.
2. `flutter run` (pick the device), enter `192.168.4.1`, then tap **Connect**.

## Structure

| Path | What |
|---|---|
| `lib/api/tester_api.dart` | HTTP client for `/api/v1` |
| `lib/models/` | JSON models |
| `lib/logic/verdict.dart` | PASS/FAIL rules + formatting (pure, unit tested) |
| `lib/data/coil_specs.dart` | Typical spec presets (edit per bike) |
| `lib/screens/` | Connect screen, resistance test screen |
