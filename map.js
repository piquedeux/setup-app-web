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
for (let i = 0; i 