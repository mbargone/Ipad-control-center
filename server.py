from flask import Flask, render_template, jsonify
import requests
from datetime import datetime

app = Flask(__name__)

# Coordonnées de Saint-Augustin-de-Desmaures, QC
LATITUDE = 46.7383
LONGITUDE = -71.3684
TIMEZONE = "America/Toronto"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/weather")
def weather():
    """Récupère la météo actuelle et les données astronomiques via Open-Meteo."""
    try:
        # Météo actuelle
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

        # Phases de la lune et lever/coucher (API secondaire Open-Meteo n'a pas la lune,
        # on utilise une approximation ou une API tierce gratuite)
        # On utilise l'API gratuite de met.no pour la lune (pas de clé requise)
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
            moon_data = {
                "moonrise": props.get("moonrise", {}).get("time", "N/A"),
                "moonset": props.get("moonset", {}).get("time", "N/A"),
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
    # host 0.0.0.0 pour être accessible sur le réseau local (iPad)
    app.run(host="0.0.0.0", port=5000, debug=True)
