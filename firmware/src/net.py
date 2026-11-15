# Wi-Fi bring-up for the Pico W: STA mode with AP fallback.
import asyncio
import network
import rp2

try:
    import wifi_config as cfg
except ImportError:
    cfg = None

STA_TIMEOUT_S = 15


def _get(name, default):
    return getattr(cfg, name, default) if cfg else default


async def connect(led=None):
    """Bring Wi-Fi up. Returns (mode, ip)."""
    rp2.country(_get("COUNTRY", "IN"))
    if _get("MODE", "ap") == "sta":
        wlan = network.WLAN(network.STA_IF)
        wlan.active(True)
        wlan.connect(_get("SSID", ""), _get("PASSWORD", ""))
        for _ in range(STA_TIMEOUT_S * 4):
            if wlan.isconnected():
                ip = wlan.ifconfig()[0]
                print("Wi-Fi STA connected, IP", ip)
                return "sta", ip
            if led:
                led.toggle()
            await asyncio.sleep_ms(250)
        print("Wi-Fi STA failed (status %s), falling back to AP" % wlan.status())
        wlan.active(False)

    ap = network.WLAN(network.AP_IF)
    ap.config(essid=_get("AP_SSID", "CoilTester"), password=_get("AP_PASSWORD", "coiltest123"))
    ap.active(True)
    while not ap.active():
        await asyncio.sleep_ms(100)
    ip = ap.ifconfig()[0]
    print("Wi-Fi AP '%s' up, IP %s" % (_get("AP_SSID", "CoilTester"), ip))
    return "ap", ip
