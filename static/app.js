// === Polyfill padStart pour vieux Safari ===
function padZero(num) {
    return num < 10 ? '0' + num : '' + num;
}

// === Jours et mois en francais ===
var joursSemaine = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
var moisAnnee = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];

// === Horloge en temps reel ===
function updateClock() {
    var now = new Date();
    var hours = padZero(now.getHours());
    var minutes = padZero(now.getMinutes());
    var seconds = padZero(now.getSeconds());
    document.getElementById('clock').textContent = hours + ':' + minutes + ':' + seconds;

    var jour = joursSemaine[now.getDay()];
    var dateNum = now.getDate();
    var mois = moisAnnee[now.getMonth()];
    var annee = now.getFullYear();
    document.getElementById('date').textContent = jour + ' ' + dateNum + ' ' + mois + ' ' + annee;
}

// === Codes meteo Open-Meteo -> description et icone ===
var weatherCodes = {
    0: { desc: 'Ciel degage', icon: '(soleil)' },
    1: { desc: 'Principalement degage', icon: '(soleil-nuage)' },
    2: { desc: 'Partiellement nuageux', icon: '(nuages)' },
    3: { desc: 'Couvert', icon: '(nuage)' },
    45: { desc: 'Brouillard', icon: '(brume)' },
    48: { desc: 'Brouillard givrant', icon: '(brume)' },
    51: { desc: 'Bruine legere', icon: '(pluie)' },
    53: { desc: 'Bruine moderee', icon: '(pluie)' },
    55: { desc: 'Bruine dense', icon: '(pluie)' },
    61: { desc: 'Pluie legere', icon: '(pluie)' },
    63: { desc: 'Pluie moderee', icon: '(pluie)' },
    65: { desc: 'Pluie forte', icon: '(pluie)' },
    66: { desc: 'Pluie verglacante legere', icon: '(neige)' },
    67: { desc: 'Pluie verglacante forte', icon: '(neige)' },
    71: { desc: 'Neige legere', icon: '(neige)' },
    73: { desc: 'Neige moderee', icon: '(neige)' },
    75: { desc: 'Neige forte', icon: '(neige)' },
    77: { desc: 'Grains de neige', icon: '(neige)' },
    80: { desc: 'Averses legeres', icon: '(pluie)' },
    81: { desc: 'Averses moderees', icon: '(pluie)' },
    82: { desc: 'Averses violentes', icon: '(pluie)' },
    85: { desc: 'Averses de neige legeres', icon: '(neige)' },
    86: { desc: 'Averses de neige fortes', icon: '(neige)' },
    95: { desc: 'Orage', icon: '(orage)' },
    96: { desc: 'Orage avec grele legere', icon: '(orage)' },
    99: { desc: 'Orage avec grele forte', icon: '(orage)' }
};

// === Phase lunaire (degres -> texte) ===
function getMoonPhaseName(degrees) {
    if (degrees === 'N/A' || degrees === undefined || degrees === null) return '--';
    var d = parseFloat(degrees);
    if (isNaN(d)) return '--';
    if (d >= 0 && d < 22.5) return 'Nouvelle lune';
    if (d < 67.5) return 'Premier croissant';
    if (d < 112.5) return 'Premier quartier';
    if (d < 157.5) return 'Gibbeuse croissante';
    if (d < 202.5) return 'Pleine lune';
    if (d < 247.5) return 'Gibbeuse decroissante';
    if (d < 292.5) return 'Dernier quartier';
    if (d < 337.5) return 'Dernier croissant';
    return 'Nouvelle lune';
}

// === Formater l'heure depuis une chaine ISO ou datetime ===
// On extrait directement HH:MM de la chaine au lieu d'utiliser new Date()
// car les vieux Safari interpretent les dates sans timezone en UTC
function formatTime(isoString) {
    if (!isoString || isoString === 'N/A') return '--:--';
    // Format attendu: "2026-07-23T05:15" ou "2026-07-23T05:15:00"
    // On cherche le T et on prend les 5 caracteres apres
    var tIndex = isoString.indexOf('T');
    if (tIndex !== -1 && isoString.length >= tIndex + 6) {
        return isoString.substring(tIndex + 1, tIndex + 6);
    }
    // Fallback: chercher un pattern HH:MM dans la chaine
    var match = isoString.match(/(\d{2}):(\d{2})/);
    if (match) {
        return match[1] + ':' + match[2];
    }
    return '--:--';
}

// === Recuperer les donnees meteo ===
function fetchWeather() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/weather', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                } catch (e) {
                    document.getElementById('condition').textContent = 'Erreur de parsing';
                    return;
                }

                if (data.error) {
                    document.getElementById('condition').textContent = 'Erreur: ' + data.error;
                    return;
                }

                var current = data.current || {};
                var daily = data.daily || {};
                var moon = data.moon || {};

                // Temperature
                var temp = current.temperature_2m;
                if (temp !== undefined && temp !== null) {
                    document.getElementById('temperature').textContent = Math.round(temp) + ' C';
                }

                // Ressenti
                var feels = current.apparent_temperature;
                if (feels !== undefined && feels !== null) {
                    document.getElementById('feels-like').textContent = Math.round(feels) + ' C';
                }

                // Humidite
                var hum = current.relative_humidity_2m;
                if (hum !== undefined && hum !== null) {
                    document.getElementById('humidity').textContent = hum + '%';
                }

                // Vent
                var wind = current.wind_speed_10m;
                if (wind !== undefined && wind !== null) {
                    document.getElementById('wind').textContent = Math.round(wind) + ' km/h';
                }

                // Condition meteo
                var code = current.weather_code;
                var weather = weatherCodes[code];
                if (!weather) {
                    weather = { desc: 'Inconnu', icon: '?' };
                }
                document.getElementById('weather-icon').textContent = weather.icon;
                document.getElementById('condition').textContent = weather.desc;

                // Temperatures min/max
                if (daily.temperature_2m_min && daily.temperature_2m_min.length > 0) {
                    document.getElementById('temp-min').textContent = 'Min: ' + Math.round(daily.temperature_2m_min[0]) + ' C';
                }
                if (daily.temperature_2m_max && daily.temperature_2m_max.length > 0) {
                    document.getElementById('temp-max').textContent = 'Max: ' + Math.round(daily.temperature_2m_max[0]) + ' C';
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
            } else {
                document.getElementById('condition').textContent = 'Erreur reseau';
            }
        }
    };
    xhr.send();
}

// === Initialisation ===
updateClock();
setInterval(updateClock, 1000);

fetchWeather();
// Mise a jour meteo toutes les 10 minutes
setInterval(fetchWeather, 10 * 60 * 1000);
