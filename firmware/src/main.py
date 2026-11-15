# Boot entry point (runs automatically on the Pico W).
import asyncio
from machine import ADC, Pin

import app
import net
from hw_pins import STATUS_LED
from resistance import ResistanceMeter


async def main():
    led = Pin(STATUS_LED, Pin.OUT)
    meter = ResistanceMeter(ADC, Pin)
    mode, ip = await net.connect(led)
    srv = app.build(meter, {"mode": mode, "ip": ip})
    await srv.serve(port=80)
    led.on()
    print("Coil Tester fw %s ready: http://%s/" % (app.FW_VERSION, ip))
    while True:
        await asyncio.sleep(3600)


try:
    asyncio.run(main())
finally:
    asyncio.new_event_loop()
