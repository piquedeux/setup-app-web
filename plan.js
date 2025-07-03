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
        // Spot/Schlafplatz auf Karte markieren
        let emoji = s.type === "sleep" ? "🛏️" : "📍";
        L.marker(s.coord, {icon: L.divIcon({className: '', html: emoji, iconSize: [24,24]})})
          .addTo(map)
          .bindPopup(s.category || s.name)
          .openPopup();
        map.setView(s.coord, 15);
      };
      suggestions.appendChild(div);
    });
    // 2. Adressvorschläge (nur wenn Text, nicht Koordinate)
    if (val && !/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(val) && val.length > 2) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&addressdetails=1`;
      const res = await fetch(url);
      const addr = await res.json();
      addr.forEach(a => {
        const div = document.createElement('div');
        div.textContent = "📍 " + a.display_name;
        div.style.fontStyle = "italic";
        div.onclick = () => {
          input.value = `${a.lat},${a.lon}`;
          suggestions.innerHTML = '';
          onSelect({ name: a.display_name, coord: [parseFloat(a.lat), parseFloat(a.lon)] });
          // Adresse auf Karte markieren
          L.marker([a.lat, a.lon], {icon: L.divIcon({className: '', html: "📍", iconSize: [24,24]})})
            .addTo(map)
            .bindPopup(a.display_name)
            .openPopup();
          map.setView([a.lat, a.lon], 15);
        };
        suggestions.appendChild(div);
      });
    }
    // 3. Wenn keine Eingabe, trotzdem alle eigenen anzeigen
    if (!val && spots.length > 0 && suggs.length === 0) {
      spots.forEach(s => {
        const div = document.createElement('div');
        div.textContent = (s.category || s.name) + (s.type === "sleep" ? " 🛏️" : " 📍");
        div.onclick = () => {
          input.value = `${s.coord[0]},${s.coord[1]}`;
          suggestions.innerHTML = '';
          onSelect(s);
          let emoji = s.type === "sleep" ? "🛏️" : "📍";
          L.marker(s.coord, {icon: L.divIcon({className: '', html: emoji, iconSize: [24,24]})})
            .addTo(map)
            .bindPopup(s.category || s.name)
            .openPopup();
          map.setView(s.coord, 15);
        };
        suggestions.appendChild(div);
      });
    }
  }

  input.oninput = showSuggestions;
  input.onfocus = showSuggestions;
  input.onblur = () => setTimeout(() => suggestions.innerHTML = '', 200);
}

// --- Map Pick/Geolocate für Start/Ziel/Stopps ---
function setupMapPick(inputId, mode) {
  document.getElementById(inputId).onclick = function() {
    window.pickMode = mode;
    map.getContainer().style.cursor = "crosshair";
  };
}
let tempMarkers = [];
function clearTempMarkers() {
  tempMarkers.forEach(m => map.removeLayer(m));
  tempMarkers = [];
}

function setupGeolocate(inputId, targetInput, type) {
  document.getElementById(inputId).onclick = function() {
    navigator.geolocation.getCurrentPosition(pos => {
      document.getElementById(targetInput).value = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
      clearTempMarkers();
      let emoji = "📍";
      if (type === "waypoint") emoji = "🛏️";
      const marker = L.marker([pos.coords.latitude, pos.coords.longitude], {icon: L.divIcon({className: '', html: emoji, iconSize: [24,24]})})
        .addTo(map)
        .bindPopup(type === "waypoint" ? "Schlafplatz" : "Position")
        .openPopup();
      tempMarkers.push(marker);
      map.setView([pos.coords.latitude, pos.coords.longitude], 15);
    });
  };
}

// --- Adresssuche-Buttons ---
document.getElementById('start-geocode-btn').onclick = async function() {
  const val = document.getElementById('start-input').value;
  const coords = await geocodeAddress(val);
  if (coords) document.getElementById('start-input').value = `${coords[0]},${coords[1]}`;
  else alert("Adresse nicht gefunden!");
};
document.getElementById('end-geocode-btn').onclick = async function() {
  const val = document.getElementById('end-input').value;
  const coords = await geocodeAddress(val);
  if (coords) document.getElementById('end-input').value = `${coords[0]},${coords[1]}`;
  else alert("Adresse nicht gefunden!");
};
document.getElementById('waypoint-geocode-btn').onclick = async function() {
  const val = document.getElementById('waypoint-input').value;
  const coords = await geocodeAddress(val);
  if (coords) {
    addWaypoint({ name: val, coord: coords });
    document.getElementById('waypoint-input').value = '';
  } else {
    alert("Adresse nicht gefunden!");
  }
};

// --- Map Click Handler für alle Pick-Modi ---
map.on('click', async function(e) {
  clearTempMarkers();
  const latlngStr = `${e.latlng.lat.toFixed(5)},${e.latlng.lng.toFixed(5)}`;
  let emoji = "📍";
  if (window.pickMode === "waypoint") emoji = "🛏️";
  if (window.pickMode === "start") {
    document.getElementById('start-input').value = latlngStr;
  } else if (window.pickMode === "end") {
    document.getElementById('end-input').value = latlngStr;
  } else if (window.pickMode === "waypoint") {
    addWaypoint({ name: latlngStr, coord: [e.latlng.lat, e.latlng.lng] });
  } else if (window.pickMode === "spot") {
    document.getElementById('spot-coord').value = latlngStr;
  }
  if (window.pickMode) {
    const marker = L.marker([e.latlng.lat, e.latlng.lng], {icon: L.divIcon({className: '', html: emoji, iconSize: [24,24]})})
      .addTo(map)
      .bindPopup(window.pickMode === "waypoint" ? "Schlafplatz" : "Position")
      .openPopup();
    tempMarkers.push(marker);
    map.setView([e.latlng.lat, e.latlng.lng], 15);
    window.pickMode = null;
    map.getContainer().style.cursor = "";
  }
});

// --- Waypoint-Handling ---
function renderWaypointList() {
  const ul = document.getElementById('waypoint-list');
  ul.innerHTML = '';
  routeWaypoints.forEach((wp, i) => {
    const li = document.createElement('li');
    li.style.display = "flex";
    li.style.alignItems = "center";
    // Rotes X
    const removeBtn = document.createElement('span');
    removeBtn.textContent = "❌";
    removeBtn.style.color = "#f44336";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.marginRight = "0.5em";
    removeBtn.onclick = () => {
      routeWaypoints.splice(i, 1);
      renderWaypointList();
    };
    li.appendChild(removeBtn);
    li.appendChild(document.createTextNode(wp.name));
    ul.appendChild(li);
  });
}

function addWaypoint(val) {
  let name, coord;
  if (typeof val === "string") {
    const s = spots.find(s => s.name === val);
    if (s) {
      name = s.name;
      coord = s.coord;
    } else if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(val)) {
      name = val;
      coord = val.split(',').map(Number);
    } else {
      name = val;
      coord = null;
    }
  } else {
    name = val.name;
    coord = val.coord;
  }
  if (!coord) return;
  routeWaypoints.push({ name, coord });
  renderWaypointList();
}

// --- Setup für Inputs ---
setupInputWithSuggestions('start-input', 'start-suggestions', s => {
  document.getElementById('start-input').value = `${s.coord[0]},${s.coord[1]}`;
});
setupInputWithSuggestions('end-input', 'end-suggestions', s => {
  document.getElementById('end-input').value = `${s.coord[0]},${s.coord[1]}`;
});
setupInputWithSuggestions('waypoint-input', 'waypoint-suggestions', s => {
  addWaypoint({ name: s.name, coord: s.coord });
  document.getElementById('waypoint-input').value = '';
});

// Map/Geolocate Buttons
setupMapPick('start-map-pick', 'start');
setupMapPick('end-map-pick', 'end');
setupMapPick('waypoint-map-pick', 'waypoint');
setupMapPick('spot-map-pick', 'spot');
setupGeolocate('start-geolocate', 'start-input', 'start');
setupGeolocate('end-geolocate', 'end-input', 'end');
setupGeolocate('waypoint-geolocate', 'waypoint-input', 'waypoint');
setupGeolocate('spot-geolocate', 'spot-coord', 'spot');

// --- Spot-Form Emoji-Auswahl einbauen (nach dem Laden) ---
window.addEventListener('DOMContentLoaded', () => {
  const spotType = document.getElementById('spot-type');
  if (spotType) {
    // Emoji-Auswahl nur für Spots, nicht für Schlafplätze
    spotType.addEventListener('change', function() {
      const emojiSelect = document.getElementById('spot-emoji');
      if (this.value === "spot") {
        emojiSelect.style.display = "";
      } else {
        emojiSelect.style.display = "none";
      }
    });
  }
});

// Füge das Emoji-Auswahlfeld ins HTML ein (z.B. nach Typ-Auswahl):
// <select id="spot-emoji"></select>
const emojiSelect = document.createElement('select');
emojiSelect.id = 'spot-emoji';
spotEmojis.forEach(e => {
  const opt = document.createElement('option');
  opt.value = e;
  opt.textContent = e;
  emojiSelect.appendChild(opt);
});
const spotTypeLabel = document.querySelector('select#spot-type');
if (spotTypeLabel && spotTypeLabel.parentElement) {
  spotTypeLabel.parentElement.appendChild(emojiSelect);
}
emojiSelect.style.marginLeft = "0.5em";

// --- Spots/Schlafplätze speichern und anzeigen ---
document.getElementById('spot-form').onsubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById('spot-name').value;
  const type = document.getElementById('spot-type').value;
  const coord = document.getElementById('spot-coord').value.split(',').map(Number);
  let emoji = "";
  if (type === "spot") {
    emoji = document.getElementById('spot-emoji').value || spotEmojis[0];
  }
  if (coord.length === 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
    spots.push({ id: name + type + coord.join(','), name, coord, type, emoji });
    updateSpotSleepLists();
    this.reset();
    // Emoji-Auswahl zurücksetzen
    document.getElementById('spot-emoji').value = spotEmojis[0];
  }
};

// --- Route planen & speichern ---
document.getElementById('tour-form').onsubmit = async function(e) {
  e.preventDefault();
  const routeName = document.getElementById('route-name').value || "Unbenannte Route";
  const startVal = document.getElementById('start-input').value;
  const endVal = document.getElementById('end-input').value;
  const waypoints = routeWaypoints.map(wp => wp.coord);

  let startCoords, endCoords;
  if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(startVal)) startCoords = startVal.split(',').map(Number);
  else {
    const s = spots.find(s => s.name === startVal);
    if (s) startCoords = s.coord;
    else startCoords = await geocodeAddress(startVal);
  }
  if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(endVal)) endCoords = endVal.split(',').map(Number);
  else {
    const s = spots.find(s => s.name === endVal);
    if (s) endCoords = s.coord;
    else endCoords = await geocodeAddress(endVal);
  }
  if (!startCoords || !endCoords) return alert("Start oder Ziel ungültig!");

  // ORS-Request
  const apiKey = '5b3ce3597851110001cf6248263492386e3d40628c7dbf37a20f27f2';
  const coordinates = [
    [startCoords[1], startCoords[0]],
    ...waypoints.map(wp => [wp[1], wp[0]]),
    [endCoords[1], endCoords[0]]
  ];
  const url = `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson?api_key=${apiKey}`;
  const body = { coordinates };
  const response = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (data && data.features && data.features[0]) {
    const coords = data.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
    const summary = data.features[0].properties.summary;
    plannedRoutes.push({
      name: routeName,
      start: getSpotNameOrCoord(startVal),
      waypoints: [...routeWaypoints],
      end: getSpotNameOrCoord(endVal),
      route: coords,
      stats: summary
    });
    updateTourList();
    document.getElementById('waypoint-list').innerHTML = '';
    routeWaypoints = [];
  } else {
    alert("Keine Route gefunden!");
  }
};

// --- Hilfsfunktion für Anzeige von Namen statt Koordinaten ---
function getSpotNameOrCoord(val) {
  const s = spots.find(s => s.name === val || s.category === val);
  if (s) return s.category || s.name;
  if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(val)) return val;
  return val;
}

// --- Routenausgabe with Tagesanzahl ---
function updateTourList() {
  const tourList = document.getElementById('tour-list');
  tourList.innerHTML = '';
  plannedRoutes.forEach((route, idx) => {
    const li = document.createElement('li');
    li.className = "tour-item";
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `🚴 <b>${route.name}</b>: <b>${route.start}</b> → <b>${route.end}</b>`;
    button.onclick = () => {
      clearLastPlannedMarkers();
      const poly = L.polyline(route.route, {color: "black", weight: 3}).addTo(map);
      lastPlannedMarkers.push(poly);
      // Start Marker 🐥
      if (route.route.length > 0) {
        const m = L.marker(route.route[0], {icon: L.divIcon({className: '', html: '🐥', iconSize: [28,28]})})
          .addTo(map)
          .bindPopup("Start");
        lastPlannedMarkers.push(m);
      }
      // Zwischenstopps 🛏️
      if (route.waypoints && route.waypoints.length > 0) {
        route.waypoints.forEach((wp, i) => {
          const m = L.marker(wp.coord, {icon: L.divIcon({className: '', html: '🛏️', iconSize: [24,24]})})
            .addTo(map)
            .bindPopup("Zwischenstopp: " + (wp.name || `Schlafplatz ${i+1}`));
          lastPlannedMarkers.push(m);
        });
      }
      // Ziel Marker 🎯
      if (route.route.length > 1) {
        const m = L.marker(route.route[route.route.length-1], {icon: L.divIcon({className: '', html: '🎯', iconSize: [28,28]})})
          .addTo(map)
          .bindPopup("Ziel");
        lastPlannedMarkers.push(m);
      }
      map.fitBounds(route.route);
    };
    li.appendChild(button);
    // Tagesanzahl: 1 Tag + 1 Tag pro Zwischenstopp
    const days = 1 + (route.waypoints ? route.waypoints.length : 0);
    const daysDiv = document.createElement('div');
    daysDiv.style.fontSize = "0.9em";
    daysDiv.style.color = "#2e8b57";
    daysDiv.innerHTML = `⏳ ${days} Tag${days > 1 ? 'e' : ''}`;
    li.appendChild(daysDiv);

    if (route.stats) {
      const stats = document.createElement('div');
      stats.style.fontSize = "0.85em";
      stats.style.color = "#666";
      stats.innerHTML = `Länge: ${(route.stats.distance/1000).toFixed(1)} km &nbsp; | &nbsp; Dauer: ${(route.stats.duration/3600).toFixed(1)} h`;
      li.appendChild(stats);
    }
    tourList.appendChild(li);
  });
}

function updateSpotSleepLists() {
  const spotList = document.getElementById('spot-list');
  const sleepList = document.getElementById('sleep-list');
  if (spotList) {
    spotList.innerHTML = '';
    const spotItems = spots.filter(s => s.type === "spot");
    spotItems.forEach(spot => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = (spot.emoji || "📍") + " " + (spot.category || spot.name);
      button.onclick = () => {
        L.marker(spot.coord, {icon: L.divIcon({className: '', html: spot.emoji || "📍", iconSize: [24,24]})})
          .addTo(map)
          .bindPopup((spot.category || spot.name))
          .openPopup();
        map.setView(spot.coord, 13);
      };
      li.appendChild(button);
      spotList.appendChild(li);
    });
  }
  if (sleepList) {
    sleepList.innerHTML = '';
    const sleepItems = spots.filter(s => s.type === "sleep");
    sleepItems.forEach(spot => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = "🛏️ " + (spot.category || spot.name);
      button.onclick = () => {
        L.marker(spot.coord, {icon: L.divIcon({className: '', html: '🛏️', iconSize: [24,24]})})
          .addTo(map)
          .bindPopup(spot.category || spot.name)
          .openPopup();
        map.setView(spot.coord, 13);
      };
      li.appendChild(button);
      sleepList.appendChild(li);
    });
  }
}

// --- Initiales Laden ---
updateTourList();
updateSpotSleepLists();

let lastPlannedRoute = null;
let lastPlannedMarkers = [];
function clearLastPlannedMarkers() {
  lastPlannedMarkers.forEach(m => map.removeLayer(m));
  lastPlannedMarkers = [];
}

// --- Route planen (orange, nicht speichern) ---
document.getElementById('route-plan-btn').onclick = async function() {
  const routeName = document.getElementById('route-name').value || "Unbenannte Route";
  const startVal = document.getElementById('start-input').value;
  const endVal = document.getElementById('end-input').value;
  const waypoints = routeWaypoints.map(wp => wp.coord);

  let startCoords, endCoords;
  if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(startVal)) startCoords = startVal.split(',').map(Number);
  else {
    const s = spots.find(s => s.name === startVal);
    if (s) startCoords = s.coord;
    else startCoords = await geocodeAddress(startVal);
  }
  if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(endVal)) endCoords = endVal.split(',').map(Number);
  else {
    const s = spots.find(s => s.name === endVal);
    if (s) endCoords = s.coord;
    else endCoords = await geocodeAddress(endVal);
  }
  if (!startCoords || !endCoords) {
    alert("Start oder Ziel ungültig!");
    return;
  }

  // ORS-Request
  const apiKey = '5b3ce3597851110001cf6248263492386e3d40628c7dbf37a20f27f2';
  const coordinates = [
    [startCoords[1], startCoords[0]],
    ...waypoints.map(wp => [wp[1], wp[0]]),
    [endCoords[1], endCoords[0]]
  ];
  const url = `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson?api_key=${apiKey}`;
  const body = { coordinates };
  let response, data;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body)
    });
    data = await response.json();
  } catch (err) {
    alert("Route konnte nicht geplant werden (Netzwerkfehler oder Server nicht erreichbar).");
    return;
  }
  clearLastPlannedMarkers();
  if (data && data.features && data.features[0]) {
    const coords = data.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
    const summary = data.features[0].properties.summary;
    lastPlannedRoute = {
      name: routeName,
      start: getSpotNameOrCoord(startVal),
      waypoints: [...routeWaypoints],
      end: getSpotNameOrCoord(endVal),
      route: coords,
      stats: summary
    };
    // Zeichne Route in Orange
    const poly = L.polyline(coords, {color: "black", weight: 3}).addTo(map);
    lastPlannedMarkers.push(poly);
    // Start Marker 🐥
    if (coords.length > 0) {
      const m = L.marker(coords[0], {icon: L.divIcon({className: '', html: '🐥', iconSize: [28,28]})})
        .addTo(map)
        .bindPopup("Start");
      lastPlannedMarkers.push(m);
    }
    // Zwischenstopps 🛏️
    if (lastPlannedRoute.waypoints && lastPlannedRoute.waypoints.length > 0) {
      lastPlannedRoute.waypoints.forEach((wp, i) => {
        const m = L.marker(wp.coord, {icon: L.divIcon({className: '', html: '🛏️', iconSize: [24,24]})})
          .addTo(map)
          .bindPopup("Zwischenstopp: " + (wp.name || `Schlafplatz ${i+1}`));
        lastPlannedMarkers.push(m);
      });
    }
    // Ziel Marker 🎯
    if (coords.length > 1) {
      const m = L.marker(coords[coords.length-1], {icon: L.divIcon({className: '', html: '🎯', iconSize: [28,28]})})
        .addTo(map)
        .bindPopup("Ziel");
      lastPlannedMarkers.push(m);
    }
    map.fitBounds(coords);
  } else {
    alert("Route konnte nicht geplant werden! Bitte überprüfe Start, Ziel und Zwischenstopps.");
  }
};

// --- Route speichern (aus letzter Planung) ---
document.getElementById('route-save-btn').onclick = function() {
  if (!lastPlannedRoute) {
    alert("Bitte zuerst Route planen!");
    return;
  }
  plannedRoutes.push({...lastPlannedRoute});
  updateTourList();
  lastPlannedRoute = null;
  clearLastPlannedMarkers();
  document.getElementById('waypoint-list').innerHTML = '';
  routeWaypoints = [];
  document.getElementById('route-save-btn').disabled = true;
};

// --- Route und Spot Eingaben zurücksetzen ---
document.getElementById('route-cancel-btn').onclick = function() {
  document.getElementById('tour-form').reset();
  routeWaypoints = [];
  renderWaypointList();
  clearLastPlannedMarkers();
  clearTempMarkers();
};

document.getElementById('spot-cancel-btn').onclick = function() {
  document.getElementById('spot-form').reset();
  clearTempMarkers();
};

//# sourceMappingURL=map.js.map