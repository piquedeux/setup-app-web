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

// Map Setup (OpenCycleMap als Start-Layer)
const map = L.map('map', {
  center: [52.52, 13.3],
  zoom: 8,
  layers: [openCycle]
});
window.map = map;

// Layer Control
L.control.layers({
  "Fahrradkarte": openCycle,
  "Satellitenkarte": satellite,
  "Straßenkarte": osm
}).addTo(map);

// Spots generieren
const spotEmojis = ["💧", "🌳", "🚻", "🍽️", "🔧", "☕", "🍺", "🏥", "📮"];
const spotCategories = ["Wasserstelle", "Rastplatz", "Toilette", "Restaurant", "Werkstatt", "Café", "Pub", "Krankenhaus", "Briefkasten"];
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

// Fahrer generieren & Icons
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
// 30 weitere Fahrer mit Zufallsdaten
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
riders.forEach(rider => {
  rider.marker = L.marker(rider.pos, {icon: riderIcon(rider.color)}).addTo(map);
});

// Fahrer Popup mit Route anzeigen
riders.forEach(rider => {
  rider.marker.on('click', () => {
    const profileLink = `<a href="/profile.html?user=${encodeURIComponent(rider.id)}" class="profile-link" target="_blank">${rider.id}</a>`;
    rider.marker.bindPopup(`
      <b>${profileLink}</b><br>
      Geschwindigkeit: ${(rider.speed * 100000).toFixed(2)} km/h<br>
    `).openPopup();
  });
});

// Fahrer bewegen (Loop)
function moveRiders() {
  riders.forEach(rider => {
    let {lat, lng} = rider.marker.getLatLng();
    lat += rider.speed;
    if (lat > 52.8) lat = 52.4;
    rider.marker.setLatLng([lat, lng]);
  });
}
setInterval(moveRiders, 700);

// --- ORS API Key ---
const ORS_API_KEY = '5b3ce3597851110001cf6248263492386e3d40628c7dbf37a20f27f2';

// --- Spots + Touren im LocalStorage ---
let savedTours = [
  {
    id: 1,
    name: "Tour Berlin → Ostsee",
    days: 5,
    creator: "Moritz",
    multiDay: true,
    startCoords: [52.52508, 13.3694], 
    endCoords: [54.0887, 12.1405]
  },
  {
    id: 2,
    name: "Rundkurs Spreewald",
    days: 3,
    creator: "Anna",
    multiDay: false,
    startCoords: [51.8686, 13.9601],
    endCoords: [51.7563, 14.3329]
  },
  {
    id: 3,
    name: "Brandenburg Seenplatte",
    days: 4,
    creator: "Tom",
    multiDay: true,
    startCoords: [52.4167, 12.5500],
    endCoords: [53.0981, 12.8927]
  }
];

let friendLogs = JSON.parse(localStorage.getItem("friendLogs")) || [
  {
    author: "Moritz",
    text: "Heute eine tolle Radtour gemacht!",
    date: Date.now() - 3600 * 1000 * 24, // vor 1 Tag
    liked: false,
    likes: 3,
    expanded: false
  },
  {
    author: "Anna",
    text: "Neue Fahrradroute entdeckt. Sehr empfehlenswert!",
    date: Date.now() - 3600 * 1000 * 48, // vor 2 Tagen
    liked: true,
    likes: 5,
    expanded: false
  },
    {
    id: 2,
    author: "Moritz",
    text: "Erster Testlauf mit der neuen App 💻🚴‍♂️",
    date: new Date(),
    likes: 2
  }
];


// Helfer: Spot per Id finden (evtl. erweitert)
function getSpotById(id) {
  return spots.find(s => s.id === id || s.name === id);
}

// Geocode (Nominatim)
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data && data[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  return null;
}

// Route von ORS holen
async function getRouteFromORS(start, waypoints, end) {
  const coords = [
    [start[1], start[0]],
    ...waypoints.map(wp => [wp[1], wp[0]]),
    [end[1], end[0]]
  ];
  const url = 'https://api.openrouteservice.org/v2/directions/cycling-regular/geojson?api_key=' + ORS_API_KEY;
  const body = { coordinates: coords };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return data;
}

let currentRouteLayer = null;
let currentRouteMarkers = [];
let meetingMarkers = [];

// Route anzeigen
function displayRoute(routeData, waypoints) {
  if (currentRouteLayer) map.removeLayer(currentRouteLayer);
  currentRouteMarkers.forEach(m => map.removeLayer(m));
  currentRouteMarkers = [];
  
  if (!routeData || !routeData.features || !routeData.features[0]) {
    alert("Keine Route gefunden!");
    return;
  }
  const coords = routeData.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
  const summary = routeData.features[0].properties.summary;

  currentRouteLayer = L.polyline(coords, { color: 'black', weight: 3 }).addTo(map);

  // Marker Start 🐥
  currentRouteMarkers.push(
    L.marker(coords[0], {
      icon: L.divIcon({ className: '', html: '🐥', iconSize: [28, 28] })
    }).addTo(map).bindPopup("Start")
  );

  // Marker Ziel 🎯
  currentRouteMarkers.push(
    L.marker(coords[coords.length - 1], {
      icon: L.divIcon({ className: '', html: '🎯', iconSize: [28, 28] })
    }).addTo(map).bindPopup("Ziel")
  );

  // Marker Zwischenstopps 🛏️
  waypoints.forEach((wp, i) => {
    L.marker(wp, {
      icon: L.divIcon({ className: '', html: '🛏️', iconSize: [24, 24] })
    }).addTo(map).bindPopup(`Zwischenstopp ${i + 1}`);
  });

  map.fitBounds(coords);

  return summary;
}

// Touren Feed aktualisieren
async function updateTourFeed() {
  const tourList = document.getElementById('tour-list');
  if (!tourList) return;

  tourList.innerHTML = '';

  for (const tour of savedTours) {
    const div = document.createElement('div');
    div.classList.add('tour-item');

    let meetingPointText = '';
    if (tour.meetingPoint) {
      meetingPointText = `<br>📌 Treffpunkt: ${tour.meetingPoint.name}`;
    }

    div.innerHTML = `
      <strong>${tour.name}</strong><br>
      Dauer: ${tour.days} Tage<br>
      Erstellt von: <a href="/profile.html?user=${encodeURIComponent(tour.creator)}" class="profile-link">${tour.creator}</a><br>
      ${tour.multiDay ? "Mehrtägige Tour" : "Tages-Tour"}${meetingPointText}<br>
      <button class="join-tour-btn" data-tour="${tour.id}">🚴 Mitfahren</button>
      <button class="set-meeting-point" data-tour="${tour.id}">📌 Treffpunkt setzen</button>
      <button class="show-route-btn" data-tour="${tour.id}">🗺️ Route anzeigen</button>
      <div class="route-info" id="route-info-${tour.id}" style="font-size:0.9em; color:#666; margin-top:0.3em;"></div>
    `;

    // Mitfahren
    div.querySelector('.join-tour-btn').addEventListener('click', e => {
      e.stopPropagation();
      alert(`Du nimmst jetzt an der Tour '${tour.name}' teil!`);
    });

    // Treffpunkt setzen
    div.querySelector('.set-meeting-point').addEventListener('click', async e => {
      e.stopPropagation();
      quickOverlayContent.innerHTML = `
        <h4>Treffpunkt wählen</h4>
        <input id="meeting-search" type="text" placeholder="Adresse oder Koordinaten">
        <div id="meeting-suggestions" class="suggestions"></div>
        <button id="meeting-map-pick" type="button">Auf Karte wählen</button>
        <button id="meeting-cancel" type="button" class="close-btn">Abbrechen</button>
      `;
      quickOverlay.style.display = 'flex';

      // Live Adressvorschläge
      const input = document.getElementById('meeting-search');
      const suggestions = document.getElementById('meeting-suggestions');
      input.oninput = async function() {
        const val = input.value.trim();
        suggestions.innerHTML = '';
        if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(val)) {
          const coords = val.split(',').map(Number);
          const div = document.createElement('div');
          div.textContent = `📍 ${coords[0]},${coords[1]}`;
          div.onclick = () => selectMeeting(coords, val);
          suggestions.appendChild(div);
        } else if (val.length > 2) {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&addressdetails=1`;
          const res = await fetch(url);
          const results = await res.json();
          results.forEach(r => {
            const div = document.createElement('div');
            div.textContent = r.display_name;
            div.onclick = () => selectMeeting([parseFloat(r.lat), parseFloat(r.lon)], r.display_name);
            suggestions.appendChild(div);
          });
        }
      };

      // Auf Karte wählen
      document.getElementById('meeting-map-pick').onclick = () => {
        alert('Karten-Auswahl noch nicht implementiert.');
      };

      // Abbrechen
      document.getElementById('meeting-cancel').onclick = () => {
        quickOverlay.style.display = 'none';
      };

      // Meeting setzen
      function selectMeeting(coords, name) {
        tour.meetingPoint = { coords, name };
        localStorage.setItem('savedTours', JSON.stringify(savedTours));
        quickOverlay.style.display = 'none';
        updateTourFeed();
      }
    });

    // Route anzeigen
    div.querySelector('.show-route-btn').addEventListener('click', async e => {
      e.stopPropagation();
      const start = tour.startCoords;
      const end = tour.endCoords;
      const waypoints = tour.meetingPoint ? [tour.meetingPoint.coords] : [];
      try {
        const routeData = await getRouteFromORS(start, waypoints, end);
        const summary = displayRoute(routeData, waypoints);
        document.getElementById(`route-info-${tour.id}`).textContent =
          `Distanz: ${(summary.distance / 1000).toFixed(1)} km, Dauer: ${(summary.duration / 3600).toFixed(1)} h`;
      } catch (err) {
        alert('Route konnte nicht geladen werden.');
      }
    });

    tourList.appendChild(div);
  }
}

// --- Friend Logs ---
// Render Log-Einträge
function updateFriendLog() {
  const logContainer = document.getElementById('friend-log-entries');
  if (!logContainer) return;
  logContainer.innerHTML = '';

  friendLogs.forEach((log, idx) => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    if (log.expanded) div.classList.add('expanded');

    div.innerHTML = `
      <div class="author">${log.author}</div>
      <div class="date">${new Date(log.date).toLocaleString()}</div>
      <div class="content">${log.text}</div>
      <div class="toggle-btn">${log.expanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}</div>
      <button class="like-btn ${log.liked ? 'liked' : ''}">❤️ ${log.likes || 0}</button>
    `;

    // Toggle Content Expand/Collapse
    div.querySelector('.toggle-btn').addEventListener('click', () => {
      log.expanded = !log.expanded;
      updateFriendLog();
    });

    // Like-Button Logik
    div.querySelector('.like-btn').addEventListener('click', () => {
      log.liked = !log.liked;
      log.likes = log.likes || 0;
      log.likes += log.liked ? 1 : -1;
      localStorage.setItem('friendLogs', JSON.stringify(friendLogs));
      updateFriendLog();
    });

    logContainer.appendChild(div);
  });
}

// Button "Mehr Logs laden"
document.getElementById('load-more-logs').addEventListener('click', () => {
  alert('Weitere Logs laden noch nicht implementiert.');
});

// --- Neues Log erstellen Overlay ---

const plusMenu = document.getElementById('plus-menu');
const quickOverlay = document.getElementById('quick-overlay');
const quickOverlayContent = document.getElementById('quick-overlay-content');

document.getElementById('add-log').addEventListener('click', () => {
  plusMenu.style.display = 'none';
  quickOverlayContent.innerHTML = `
    <h4>Neuen Log erstellen</h4>
    <input type="text" id="log-author" placeholder="Name">
    <textarea id="log-text" rows="4" placeholder="Was möchtest du mitteilen?"></textarea>
    <div class="quick-form-actions">
      <button id="save-log" type="button">Speichern</button>
      <button id="cancel-log" class="close-btn" type="button">Abbrechen</button>
    </div>
  `;
  quickOverlay.style.display = 'flex';

  document.getElementById('cancel-log').onclick = () => quickOverlay.style.display = 'none';

  document.getElementById('save-log').onclick = () => {
    const author = document.getElementById('log-author').value.trim();
    const text = document.getElementById('log-text').value.trim();
    if (!author || !text) {
      alert("Bitte Name und Text ausfüllen!");
      return;
    }
    friendLogs.unshift({ author, text, date: Date.now(), liked: false });
    localStorage.setItem("friendLogs", JSON.stringify(friendLogs));
    quickOverlay.style.display = 'none';
    updateFriendLog();
  };
});

// Initial Update Calls
updateTourFeed();
updateFriendLog();
