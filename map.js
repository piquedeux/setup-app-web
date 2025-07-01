// Leaflet Map Setup
const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: ''
});
const openCycle = L.tileLayer(
  'https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=21cc11436f2e4f3fb21e9c54503048ed',
  {
    attribution: '<a href="https://www.opencyclemap.org/docs/" target="_blank" rel="noopener">Legende</a>'
  }
);
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: ''
});

// Map-Setup (OpenCycleMap als Start-Layer)
const map = L.map('map', {
  center: [52.52, 13.3],
  zoom: 8,
  layers: [openCycle]
});
window.map = map;

// Layer-Control mit angepassten Namen und Reihenfolge
L.control.layers({
  "Fahrradkarte": openCycle,
  "Satellitenkarte": satellite,
  "Straßenkarte": osm
}).addTo(map);

// --- Viele Spots generieren ---
const spotEmojis = ["💧", "🌳", "🚻", "🍽️", "🔧", "☕", "🍺", "🏥", "📮"];
const spotCategories = ["Wasserstelle", "Rastplatz", "Toilette", "Cafe", "Werkstatt", "Café", "Pub", "Krankenhaus", "Briefkasten"];
const spots = [];
for (let i = 0; i < 200; i++) {
  const lat = 52.4 + Math.random() * 0.4; // Berlin-Umgebung
  const lng = 13.1 + Math.random() * 0.6;
  const idx = Math.floor(Math.random() * spotEmojis.length);
  spots.push({
    lat,
    lng,
    info: `${spotEmojis[idx]} ${spotCategories[idx]} #${i + 1}`,
    emoji: spotEmojis[idx],
    category: spotCategories[idx]
  });
}
const spotIcon = (emoji) => L.divIcon({
  className: '',
  html: `<span style="font-size: 28px;">${emoji}</span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});
spots.forEach(s => {
  s.marker = L.marker([s.lat, s.lng], {icon: spotIcon(s.emoji)}).addTo(map).bindPopup(s.info);
});

// --- Viele Fahrer generieren ---
const directions = [
  [0.00015, 0],      // Norden
  [-0.00015, 0],     // Süden
  [0, 0.00015],      // Osten
  [0, -0.00015],     // Westen
  [0.0001, 0.0001],  // Nordost
  [0.0001, -0.0001], // Nordwest
  [-0.0001, 0.0001], // Südost
  [-0.0001, -0.0001] // Südwest
];
const riderColors = ["red", "gold", "blue", "green", "purple", "orange", "brown", "pink", "teal", "black"];
const riders = [
  {id: 'Moritz', pos: [52.52, 13.4], color: 'red', speed: 0.00015, dir: [0.00015, 0]},
  {id: 'Anna', pos: [52.53, 13.35], color: 'gold', speed: 0.00012, dir: [0, 0.00012]},
  {id: 'Tom', pos: [52.51, 13.38], color: 'blue', speed: 0.0001, dir: [-0.0001, 0]}
];
// 30 weitere Fahrer mit zufälligen Startpunkten, Farben und Richtungen
for (let i = 0; i < 30; i++) {
  const lat = 52.4 + Math.random() * 0.4;
  const lng = 13.1 + Math.random() * 0.6;
  const color = riderColors[i % riderColors.length];
  const dir = directions[i % directions.length];
  riders.push({
    id: `Fahrer${i + 1}`,
    pos: [lat, lng],
    color,
    speed: 0.00008 + Math.random() * 0.00012,
    dir
  });
}
const riderIcon = (color) => L.divIcon({
  className: '',
  html: `<span style="font-size: 32px; color:${color}; user-select:none;">🚴</span>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

// Beispiel: Routen für die ersten Fahrer (Dummy-Daten)
const riderRoutes = {
  'Moritz': [
    [52.52, 13.4], [52.54, 13.41], [52.56, 13.42], [52.58, 13.43], [52.60, 13.44]
  ],
  'Anna': [
    [52.53, 13.35], [52.55, 13.36], [52.57, 13.37], [52.59, 13.38], [52.61, 13.39]
  ],
  'Tom': [
    [52.51, 13.38], [52.53, 13.39], [52.55, 13.40], [52.57, 13.41], [52.59, 13.42]
  ]
};

let currentRiderRoute; // Zum Entfernen der alten Route

riders.forEach(rider => {
  rider.marker = L.marker(rider.pos, {icon: riderIcon(rider.color)}).addTo(map);
  rider.marker.on('click', () => {
    // Profil-Link
    const profileLink = `<a href="/profile.html?user=${encodeURIComponent(rider.id)}" class="profile-link" target="_blank">${rider.id}</a>`;
    rider.marker.bindPopup(`
      <b>${profileLink}</b><br>
      Geschwindigkeit: ${(rider.speed * 100000).toFixed(2)} km/h<br>
      <button id="show-route-${rider.id}">Route anzeigen</button>
    `).openPopup();

    // Button-Event nach Öffnen des Popups
    setTimeout(() => {
      const btn = document.getElementById(`show-route-${rider.id}`);
      if (btn) {
        btn.onclick = () => {
          // Alte Route entfernen
          if (currentRiderRoute) {
            map.removeLayer(currentRiderRoute);
          }
          // Neue Route zeichnen (nur für Moritz, Anna, Tom als Beispiel)
          const route = riderRoutes[rider.id];
          if (route) {
            currentRiderRoute = L.polyline(route, {color: rider.color, weight: 5, dashArray: "6 6"}).addTo(map);
            map.fitBounds(route);
          }
        };
      }
    }, 100);
  });
});

// Fahrer bewegen sich in ihrer Richtung mit Loop
function moveRiders() {
  riders.forEach(rider => {
    let {lat, lng} = rider.marker.getLatLng();
    lat += rider.speed; // Nur nach Norden bewegen
    if (lat > 52.8) lat = 52.4; // Begrenzung auf Kartenbereich
    rider.marker.setLatLng([lat, lng]);
  });
}
setInterval(moveRiders, 700);
