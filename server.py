from flask import Flask, render_template, jsonify
import requests
from datetime import datetime, timezone, timedelta
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

app = Flask(__name__)

# Coordonnees de Saint-Augustin-de-Desmaures, QC
LATITUDE = 46.7383
LONGITUDE = -71.3684
TIMEZONE = "America/Toronto"


def utc_to_local(iso_string):
    """Convertit une heure ISO UTC en heure locale (America/Toronto) au format HH:MM."""
    if not iso_string or iso_string == "N/A":
        return "N/A"
    try:
        # Parser la date ISO (ex: "2026-07-23T23:42:00+00:00")
        dt = datetime.fromisoformat(iso_string)
        # Convertir en heure locale
        local_dt = dt.astimezone(ZoneInfo(TIMEZONE))
        return local_dt.strftime("%Y-%m-%dT%H:%M")
    except Exception:
        return iso_string


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/weather")
def weather():
    """Recupere la meteo actuelle et les donnees astronomiques via Open-Meteo."""
    try:
        # Meteo actuelle
        weather_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={LATITUDE}&longitude={LONGITUDE}"
            f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,"
            f"weather_code,wind_speed_10m,wind_direction_10m"
            f"&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min"
            f"&timezone={TIMEZONE}"
            f"&forecast_days=1"
        )
        weather_resp = requests.get(weather_url, timeout=10)
        weather_data = weather_resp.json()

        # Lune via API met.no (gratuite, pas de cle requise)
        moon_url = (
            f"https://api.met.no/weatherapi/sunrise/3.0/moon?"
            f"lat={LATITUDE}&lon={LONGITUDE}&date={datetime.now().strftime('%Y-%m-%d')}"
        )
        headers = {"User-Agent": "IpadControlCenter/1.0"}
        moon_resp = requests.get(moon_url, headers=headers, timeout=10)

        moon_data = {}
        if moon_resp.status_code == 200:
            moon_json = moon_resp.json()
            props = moon_json.get("properties", {})
            # Convertir les heures UTC en heure locale
            moonrise_raw = props.get("moonrise", {}).get("time", "N/A")
            moonset_raw = props.get("moonset", {}).get("time", "N/A")
            moon_data = {
                "moonrise": utc_to_local(moonrise_raw),
                "moonset": utc_to_local(moonset_raw),
                "phase": props.get("moonphase", "N/A"),
            }

        return jsonify({
            "current": weather_data.get("current", {}),
            "daily": weather_data.get("daily", {}),
            "moon": moon_data,
            "units": weather_data.get("current_units", {}),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # host 0.0.0.0 pour etre accessible sur le reseau local (iPad)
    app.run(host="0.0.0.0", port=5000, debug=True)
