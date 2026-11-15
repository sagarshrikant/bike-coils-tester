# HTTP API routes (/api/v1). Kept free of machine/network imports so it runs on the host in tests.
import time

from httpd import Server

FW_VERSION = "0.1.0"

INDEX_HTML = """<!doctype html><meta name=viewport content="width=device-width">
<title>Coil Tester</title><body style="font-family:sans-serif;max-width:30em;margin:1em auto;padding:0 1em">
<h2>Coil Tester</h2><p id=i></p>
<button onclick="m('auto')">Measure resistance</button> <button onclick="z()">Zero leads</button>
<pre id=o style="font-size:1.4em"></pre>
<script>
const o=document.getElementById('o');
fetch('/api/v1/info').then(r=>r.json()).then(j=>i.textContent='fw '+j.fw_version+' · '+j.ip);
function m(r){o.textContent='...';fetch('/api/v1/resistance?range='+r).then(r=>r.json())
 .then(j=>o.textContent=j.ok?(j.status.toUpperCase()+'  '+(j.ohms??'')+' \\u03a9  ['+j.range+']'):j.error)}
function z(){fetch('/api/v1/calibrate/zero',{method:'POST'}).then(r=>r.json())
 .then(j=>o.textContent=j.ok?'lead '+j.lead_ohms+' \\u03a9 stored':j.error)}
</script>"""


def _ticks_ms():
    return time.ticks_ms() if hasattr(time, "ticks_ms") else int(time.time() * 1000)


def build(meter, net_info):
    """meter: ResistanceMeter; net_info: dict with 'mode' and 'ip'."""
    srv = Server()
    boot_ms = _ticks_ms()

    @srv.route("GET", "/")
    async def index(q, body):
        return 200, INDEX_HTML

    @srv.route("GET", "/api/v1/info")
    async def info(q, body):
        return 200, {
            "ok": True,
            "device": "bike-coils-tester",
            "fw_version": FW_VERSION,
            "ip": net_info.get("ip"),
            "mode": net_info.get("mode"),
            "uptime_s": (_ticks_ms() - boot_ms) // 1000,
            "lead_ohms": round(meter.lead_ohms, 3),
            "features": ["resistance"],
        }

    @srv.route("GET", "/api/v1/resistance")
    async def resistance(q, body):
        return 200, await meter.measure(q.get("range", "auto"))

    @srv.route("POST", "/api/v1/calibrate/zero")
    async def zero(q, body):
        lead = await meter.calibrate_zero()
        return 200, {"ok": True, "lead_ohms": round(lead, 3)}

    return srv
