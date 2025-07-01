// Kartenlayer
const basic = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
});

const cycle = L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
  attribution: 'Map tiles by Stamen Design, CC BY 3.0 — Map data &copy; OpenStreetMap contributors'
});

const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/' +
  'World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri'
});

// Karte initialisieren mit Basic-Layer
const map = L.map('map', {
  center: [52.52, 13.3],
  zoom: 11,
  layers: [basic]
});

// Layersteuerung
L.control.layers({
  "Basic": basic,
  "Fahrrad (Stamen Terrain)": cycle,
  "Satellit (Esri)": satellite
}).addTo(map);

// Beispiel Spots
const spots = [
  {lat: 52.51, lng: 13.37, info: "💧 Trinkwasser an Parkbank", emoji: "💧", category: "Wasserstelle"},
  {lat: 52.54, lng: 13.29, info: "🌳 Schattiger Rastplatz", emoji: "🌳", category: "Rastplatz"},
  {lat: 52.48, lng: 13.35, info: "🚻 Toilettenanlage", emoji: "🚻", category: "Toilette"},
  {lat: 52.53, lng: 13.32, info: "🍽️ Café am Radweg", emoji: "🍽️", category: "Cafe"},
];

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

// Fahrer Daten & Marker
const riders = [
  {id: 'Moritz', pos: [52.52, 13.4], color: 'red', speed: 0.00015},
  {id: 'Anna', pos: [52.53, 13.35], color: 'gold', speed: 0.00012},
  {id: 'Tom', pos: [52.51, 13.38], color: 'gold', speed: 0.0001}
];

const riderIcon = (color) => L.divIcon({
  className: '',
  html: `<span style="font-size: 32px; color:${color}; user-select:none;">🚴</span>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

riders.forEach(rider => {
  rider.marker = L.marker(rider.pos, {icon: riderIcon(rider.color)}).addTo(map);
  rider.marker.on('click', () => {
    rider.marker.bindPopup(`
      <b>${rider.id}</b><br>
      Geschwindigkeit: ${(rider.speed * 100000).toFixed(2)} km/h
    `).openPopup();
  });
});

// Fahrer bewegen sich Richtung Norden mit Loop
function moveRiders() {
  riders.forEach(rider => {
    let {lat, lng} = rider.marker.getLatLng();
    lat += rider.speed;
    if (lat > 52.65) lat = 52.5;
    rider.marker.setLatLng([lat, lng]);
  });
}
setInterval(moveRiders, 1000);
