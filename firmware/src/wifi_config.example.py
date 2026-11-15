# Copy to wifi_config.py (gitignored) and edit, then copy it to the Pico along with the other files.

# "ap"  = the Pico creates its own network (works anywhere, phone connects to it)
# "sta" = the Pico joins your Wi-Fi; falls back to AP mode if that fails
MODE = "ap"

# Used in "sta" mode
SSID = "your-wifi-name"
PASSWORD = "your-wifi-password"

# Used in "ap" mode (and as the fallback). Password must be at least 8 characters.
AP_SSID = "CoilTester"
AP_PASSWORD = "coiltest123"

COUNTRY = "IN"   # two-letter Wi-Fi regulatory country code
