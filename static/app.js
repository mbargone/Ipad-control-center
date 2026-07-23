// === Horloge en temps réel ===
function updateClock() {
    var now = new Date();
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = hours + ':' + minutes + ':' + seconds;

    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var dateStr = now.toLocaleDateString('fr-CA', options);
    document.getElementById('date').textContent = dateStr;
}

// === Codes météo Open-Meteo -> description et icône ===
var weatherCodes = {
    0: { desc: 'Ciel dégagé', icon: '☀️' },
    1: { desc: 'Principalement dégagé', icon: '🌤️' },
    2: { desc: 'Partiellement nuageux', icon: '⛅' },
    3: { desc: 'Couvert', icon: '☁️' },
    45: { desc: 'Brouillard', icon: '🌫️' },
    48: { desc: 'Brouillard givrant', icon: '🌫️' },
    51: { desc: 'Bruine légère', icon: '🌦️' },
    53: { desc: 'Bruine modérée', icon: '🌦️' },
    55: { desc: 'Bruine dense', icon: '🌧️' },
    61: { desc: 'Pluie légère', icon: '🌧️' },
    63: { desc: 'Pluie modérée', icon: '🌧️' },
    65: { desc: 'Pluie forte', icon: '🌧️' },
    66: { desc: 'Pluie verglaçante légère', icon: '🌨️' },
    67: { desc: 'Pluie verglaçante forte', icon: '🌨️' },
    71: { desc: 'Neige légère', icon: '❄️' },
    73: { desc: 'Neige modérée', icon: '❄️' },
    75: { desc: 'Neige forte', icon: '❄️' },
    77: { desc: 'Grains de neige', icon: '🌨️' },
    80: { desc: 'Averses légères', icon: '🌦️' },
    81: { desc: 'Averses modérées', icon: '🌧️' },
    82: { desc: 'Averses violentes', icon: '🌧️' },
    85: { desc: 'Averses de neige légères', icon: '🌨️' },
    86: { desc: 'Averses de neige fortes', icon: '🌨️' },
    95: { desc: 'Orage', icon: '⛈️' },
    96: { desc: 'Orage avec grêle légère', icon: '⛈️' },
    99: { desc: 'Orage avec grêle forte', icon: '⛈️' }
};

// === Phase lunaire (degrés -> texte) ===
function getMoonPhaseName(degrees) {
    if (degrees === 'N/A' || degrees === undefined) return '--';
    var d = parseFloat(degrees);
    if (d >= 0 && d < 22.5) return '🌑 Nouvelle lune';
    if (d < 67.5) return '🌒 Premier croissant';
    if (d < 112.5) return '🌓 Premier quartier';
    if (d < 157.5) return '🌔 Gibbeuse croissante';
    if (d < 202.5) return '🌕 Pleine lune';
    if (d < 247.5) return '🌖 Gibbeuse décroissante';
    if (d < 292.5) return '🌗 Dernier quartier';
    if (d < 337.5) return '🌘 Dernier croissant';
    return '🌑 Nouvelle lune';
}

// === Formater l'heure depuis ISO ===
function formatTime(isoString) {
    if (!isoString || isoString === 'N/A') return '--:--';
    try {
        var date = new Date(isoString);
        var h = String(date.getHours()).padStart(2, '0');
        var m = String(date.getMinutes()).padStart(2, '0');
        return h + ':' + m;
    } catch (e) {
        return '--:--';
    }
}

// === Récupérer les données météo ===
function fetchWeather() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/weather', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);

            if (data.error) {
                document.getElementById('condition').textContent = 'Erreur: ' + data.error;
                return;
            }

            var current = data.current || {};
            var daily = data.daily || {};
            var moon = data.moon || {};

            // Température
            var temp = current.temperature_2m;
            document.getElementById('temperature').textContent = (temp !== undefined ? Math.round(temp) + '°C' : '--°C');

            // Ressenti
            var feels = current.apparent_temperature;
            document.getElementById('feels-like').textContent = (feels !== undefined ? Math.round(feels) + '°C' : '--°C');

            // Humidité
            var hum = current.relative_humidity_2m;
            document.getElementById('humidity').textContent = (hum !== undefined ? hum + '%' : '--%');

            // Vent
            var wind = current.wind_speed_10m;
            document.getElementById('wind').textContent = (wind !== undefined ? Math.round(wind) + ' km/h' : '-- km/h');

            // Condition météo
            var code = current.weather_code;
            var weather = weatherCodes[code] || { desc: 'Inconnu', icon: '❓' };
            document.getElementById('weather-icon').textContent = weather.icon;
            document.getElementById('condition').textContent = weather.desc;

            // Températures min/max
            if (daily.temperature_2m_min && daily.temperature_2m_min.length > 0) {
                document.getElementById('temp-min').textContent = '⬇ ' + Math.round(daily.temperature_2m_min[0]) + '°C';
            }
            if (daily.temperature_2m_max && daily.temperature_2m_max.length > 0) {
                document.getElementById('temp-max').textContent = '⬆ ' + Math.round(daily.temperature_2m_max[0]) + '°C';
            }

            // Soleil
            if (daily.sunrise && daily.sunrise.length > 0) {
                document.getElementById('sunrise').textContent = formatTime(daily.sunrise[0]);
            }
            if (daily.sunset && daily.sunset.length > 0) {
                document.getElementById('sunset').textContent = formatTime(daily.sunset[0]);
            }

            // Lune
            document.getElementById('moonrise').textContent = formatTime(moon.moonrise);
            document.getElementById('moonset').textContent = formatTime(moon.moonset);
            document.getElementById('moon-phase').textContent = getMoonPhaseName(moon.phase);
        }
    };
    xhr.send();
}

// === Initialisation ===
updateClock();
setInterval(updateClock, 1000);

fetchWeather();
// Mise à jour météo toutes les 10 minutes
setInterval(fetchWeather, 10 * 60 * 1000);
