// --- Leaflet Map Setup ---
const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '' });
const openCycle = L.tileLayer('https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=21cc11436f2e4f3fb21e9c54503048ed', { attribution: '<a href="https://www.opencyclemap.org/docs/" target="_blank" rel="noopener">Legende</a>' });
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' });

const map = L.map('map', {
  center: [52.52, 13.3],
  zoom: 14,
  layers: [openCycle]
});
L.control.layers({
  "Fahrradkarte": openCycle,
  "Satellitenkarte": satellite,
  "Straßenkarte": osm
}).addTo(map);

// --- Map Expand Button ---
const mapContainer = document.getElementById('map-container');
const growBtn = document.getElementById('map-grow-btn');
let grown = false;

growBtn.onclick = function() {
  grown = !grown;
  mapContainer.classList.toggle('grown', grown);
  growBtn.classList.toggle('sticky', grown);
  growBtn.innerText = grown ? "⏫" : "⏬";
  growBtn.title = grown ? "Karte wieder einklappen" : "Karte nach unten ausklappen";
  setTimeout(() => map.invalidateSize(), 400);
};


// --- Datenhaltung ---
let spots = [
  { id: "A", name: "Campingplatz Wannsee", coord: [52.434, 13.180], type: "sleep" },
  { id: "B", name: "Hostel Mitte", coord: [52.520, 13.405], type: "sleep" },
  { id: "C", name: "Schlafplatz am See", coord: [52.48, 13.25], type: "sleep" },
  { id: "D", name: "Brunnenplatz", coord: [52.51, 13.39], type: "spot" },
  { id: "E", name: "Fahrradladen", coord: [52.53, 13.37], type: "spot" }
];
let plannedRoutes = [];
let routeWaypoints = [];
let routeMarkers = [];

// Emojis für Spots
const spotEmojis = ["💧", "🌳", "🚻", "🍽️", "🔧", "☕", "🍺", "🏥", "📮"];

// --- Utility: Vorschläge für Suche ---
function getSuggestions(query) {
  if (!query) return [];
  query = query.toLowerCase();
  return spots.filter(s => s.name.toLowerCase().includes(query));
}

// --- Utility: Adresssuche (Nominatim) ---
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data && data[0]) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }
  return null;
}

// --- Suche mit Vorschlägen für Start/Ziel/Stopps ---
function setupInputWithSuggestions(inputId, suggestionsId, onSelect) {
  const input = document.getElementById(inputId);
  const suggestions = document.getElementById(suggestionsId);

  async function showSuggestions() {
    const val = input.value;
    suggestions.innerHTML = '';
    // 1. Eigene Spots/Schlafplätze
    const suggs = getSuggestions(val);
    suggs.forEach(s => {
      const div = document.createElement('div');
      div.textContent = (s.category || s.name) + (s.type === "sleep" ? " 🛏️" : " 📍");
      div.onclick = () => {
        input.value = `${s.coord[0]},${s.coord[1]}`;
        suggestions.innerHTML = '';
        onSelect(s);
        // Spot/Schl