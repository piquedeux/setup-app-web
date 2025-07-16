document.addEventListener("DOMContentLoaded", () => {
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

let customMaptiler;
try {
  customMaptiler = new L.maptiler.maptilerLayer({
    apiKey: "CFkN2tzFRlUROwVG93Cn",
    style: "https://api.maptiler.com/maps/0198127a-c9cf-7690-a1af-d08f47d873ca/style.json"
  });
} catch (err) {
  console.error("MapTiler konnte nicht geladen werden:", err);
  customMaptiler = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'); // Fallback
}

// Map Setup
const map = L.map('map', {
  center: [52.52, 13.3],
  zoom: 10,
  layers: [customMaptiler]
});
window.map = map;

// Layer Control
L.control.layers({
  "Teral map": customMaptiler, 
  "Cycle map": openCycle,
  "Satellite map": satellite,
  "Street map": osm
}).addTo(map);

// Spots generieren
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
      <!-- <button id="show-route-${rider.id}">Route anzeigen</button> -->
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
    // Berlin Hbf
    startCoords: [52.52508, 13.3694], // [lat, lng]
    // Rostock Hbf
    endCoords: [54.0887, 12.1405]     // [lat, lng]
  },
  {
    id: 2,
    name: "Rundkurs Spreewald",
    days: 3,
    creator: "Anna",
    multiDay: false,
    // Lübbenau
    startCoords: [51.8686, 13.9601],
    // Cottbus
    endCoords: [51.7563, 14.3329]
  },
  {
    id: 3,
    name: "Brandenburg Seenplatte",
    days: 4,
    creator: "Tom",
    multiDay: true,
    // Brandenburg an der Havel
    startCoords: [52.4167, 12.5500],
    // Rheinsberg
    endCoords: [53.0981, 12.8927]
  }
];

// --- Helfer: Spot per Id finden ---
function getSpotById(id) {
  return spots.find(s => s.id === id || s.name === id);
}

// --- Geocode (Nominatim) ---
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data && data[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  return null;
}

// --- Route von ORS holen ---
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

// --- Route anzeigen ---
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

// --- Touren Feed aktualisieren ---
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
      Duration: ${tour.days} days<br>
      Created by: <a href="/profile.html?user=${encodeURIComponent(tour.creator)}" class="profile-link">${tour.creator}</a><br>
      ${meetingPointText}<br>
      <button class="join-tour-btn" data-tour="${tour.id}">Join</button>
      <button class="set-meeting-point" data-tour="${tour.id}">Set meeting point</button>
      <button class="show-route-btn" data-tour="${tour.id}">Show route</button>
      <div class="route-info" id="route-info-${tour.id}" style="font-size:0.9em; color:#666; margin-top:0.3em;"></div>
    `;

    // Mitfahren
    div.querySelector('.join-tour-btn').addEventListener('click', e => {
      e.stopPropagation();
      showJoinHint(tour.name, tour.creator);
    });

    // Treffpunkt setzen
    div.querySelector('.set-meeting-point').addEventListener('click', async e => {
      e.stopPropagation();
      quickOverlayContent.innerHTML = `
        <h4>Select meeting point</h4>
        <input id="meeting-search" type="text" placeholder="Address or Coordinates">
        <div id="meeting-suggestions" class="suggestions"></div>
        <button id="meeting-map-pick" type="button">Set on map</button>
        <button id="meeting-cancel" type="button" class="close-btn">Close</button>
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
          const addr = await res.json();
          addr.forEach(a => {
            const div = document.createElement('div');
            div.textContent = "📍 " + a.display_name;
            div.onclick = () => selectMeeting([parseFloat(a.lat), parseFloat(a.lon)], a.display_name);
            suggestions.appendChild(div);
          });
        }
      };

      // Karte auswählen
      document.getElementById('meeting-map-pick').onclick = () => {
        quickOverlay.style.display = 'none';
        map.once('click', e => {
          selectMeeting([e.latlng.lat, e.latlng.lng], `${e.latlng.lat.toFixed(5)},${e.latlng.lng.toFixed(5)}`);
        });
        map.getContainer().style.cursor = "crosshair";
      };

      // Abbrechen
      document.getElementById('meeting-cancel').onclick = () => quickOverlay.style.display = 'none';

      function selectMeeting(coords, name) {
        tour.meetingPoint = { name, coord: coords };
        meetingMarkers.forEach(m => map.removeLayer(m));
        meetingMarkers = [];
        const marker = L.marker(coords, { icon: L.divIcon({ className: '', html: "📌", iconSize: [24, 24] }) })
          .addTo(map)
          .bindPopup(`Treffpunkt: ${name}`)
          .openPopup();
        meetingMarkers.push(marker);
        quickOverlay.style.display = 'none';
        updateTourFeed();
        map.getContainer().style.cursor = "";
      }
    });

    // Route anzeigen
    div.querySelector('.show-route-btn').addEventListener('click', async e => {
      e.stopPropagation();
      scrollToMap();

      const startCoords = tour.startCoords;
      const endCoords = tour.endCoords;

      if (!startCoords || !endCoords) {
        alert("Start oder Ziel nicht verfügbar!");
        return;
      }

      const coordinates = [
        [startCoords[1], startCoords[0]], // [lng, lat]
        [endCoords[1], endCoords[0]]      // [lng, lat]
      ];
      const url = `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson?api_key=${ORS_API_KEY}`;
      const body = { coordinates };
      let data;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        data = await res.json();
      } catch (err) {
        alert("Fehler beim Laden der Route: " + err);
        return;
      }

      if (!data || !data.features || !data.features[0]) {
        alert("Route konnte nicht geladen werden. (ORS-Fehler)");
        console.log("ORS response:", data);
        return;
      }

      // Vorherige Route und Marker entfernen
      if (currentRouteLayer) map.removeLayer(currentRouteLayer);
      currentRouteMarkers.forEach(m => map.removeLayer(m));
      currentRouteMarkers = [];

      const coords = data.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
      const summary = data.features[0].properties.summary;

      currentRouteLayer = L.polyline(coords, { color: 'black', weight: 3 }).addTo(map);

      // Start Marker 🐥
      currentRouteMarkers.push(
        L.marker(coords[0], {
          icon: L.divIcon({ className: '', html: '🐥', iconSize: [28, 28] })
        }).addTo(map).bindPopup("Start")
      );

      // Ziel Marker 🎯
      currentRouteMarkers.push(
        L.marker(coords[coords.length - 1], {
          icon: L.divIcon({ className: '', html: '🎯', iconSize: [28, 28] })
        }).addTo(map).bindPopup("Ziel")
      );

      map.fitBounds(coords);

      // Distanz & Dauer anzeigen
      const infoDiv = document.getElementById(`route-info-${tour.id}`);
      if (summary) {
        infoDiv.innerHTML = `Länge: ${(summary.distance / 1000).toFixed(1)} km &nbsp; | &nbsp; Dauer: ${(summary.duration / 3600).toFixed(1)} h`;
      }
    });

    tourList.appendChild(div);
  }
}

// plusMenu.js

const plusBtn = document.getElementById('plus-button');
const plusMenu = document.getElementById('plus-menu');
const quickOverlay = document.getElementById('quick-overlay');
const quickOverlayContent = document.getElementById('quick-overlay-content');

// Menü öffnen/schließen
plusBtn.addEventListener('click', () => {
  plusMenu.style.display = plusMenu.style.display === 'flex' ? 'none' : 'flex';
});

// Overlay schließen bei Klick außerhalb
quickOverlay.addEventListener('mousedown', (e) => {
  if (e.target === quickOverlay) {
    quickOverlay.style.display = 'none';
  }
});

// Schnell Spot hinzufügen Overlay
document.getElementById('add-spot').addEventListener('click', () => {
  plusMenu.style.display = 'none';
  quickOverlayContent.innerHTML = `
    <h4>Quick Add Spot</h4>
    <label for="quick-spot-category">Category</label>
    <select id="quick-spot-category" required>
      <option value="">Please select</option>
      <option value="Water">Water</option>
      <option value="Rest area">Rest area</option>
      <option value="Toilet">Toilet</option>
      <option value="Pub">Pub</option>
      <option value="Hospital">Hospital</option>
      <option value="Restaurant">Restaurant</option>
      <option value="Workshop">Workshop</option>
      <option value="Post">Post</option>
      <option value="Cafe">Cafe</option>
    </select>
    <div class="quick-form-actions">
      <button id="quick-spot-here" type="button">Add spot here</button>
      <button id="quick-spot-manual" type="button">Add manually</button>
      <button id="quick-spot-cancel" type="button" class="close-btn">Cancel</button>
    </div>
  `;
  quickOverlay.style.display = 'flex';

  document.getElementById('quick-spot-cancel').onclick = () => quickOverlay.style.display = 'none';
  document.getElementById('quick-spot-manual').onclick = () => {
    quickOverlay.style.display = 'none';
    window.location.href = "/plan.html#spot-details";
  };
  document.getElementById('quick-spot-here').onclick = () => {
    const category = document.getElementById('quick-spot-category').value;
    if (!category) {
      alert("Bitte eine Kategorie wählen!");
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        addQuickSpot(category, pos.coords.latitude, pos.coords.longitude);
      }, function() {
        alert("Standort nicht verfügbar.");
      });
    } else {
      alert("Standort nicht verfügbar.");
    }
    quickOverlay.style.display = 'none';
  };
});

// Schnell Route planen Overlay
document.getElementById('start-plan').addEventListener('click', () => {
  plusMenu.style.display = 'none';
  quickOverlayContent.innerHTML = `
    <h4>Schnell Route planen</h4>
    <input id="quick-dest" type="text" placeholder="Adresse oder Koordinaten" required>
    <div id="quick-dest-suggestions" class="suggestions"></div>
    <button id="quick-dest-map-pick" type="button">Pick on map</button>
    <div class="quick-form-actions">
      <button id="quick-route-plan" type="button">Plan route</button>
      <button id="quick-multiday" type="button">Plan multi-day tour</button>
      <button id="quick-route-cancel" type="button" class="close-btn">Cancel</button>
    </div>
  `;
  quickOverlay.style.display = 'flex';

  // Live Adressvorschläge
  const input = document.getElementById('quick-dest');
  const suggestions = document.getElementById('quick-dest-suggestions');
  let destCoords = null;
  input.oninput = async function() {
    const val = input.value.trim();
    suggestions.innerHTML = '';
    destCoords = null;
    if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(val)) {
      destCoords = val.split(',').map(Number);
      const div = document.createElement('div');
      div.textContent = `📍 ${destCoords[0]},${destCoords[1]}`;
      div.onclick = () => { input.value = `${destCoords[0]},${destCoords[1]}`; suggestions.innerHTML = ''; };
      suggestions.appendChild(div);
    } else if (val.length > 2) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&addressdetails=1`;
      const res = await fetch(url);
      const addr = await res.json();
      addr.forEach(a => {
        const div = document.createElement('div');
        div.textContent = "📍 " + a.display_name;
        div.onclick = () => {
          destCoords = [parseFloat(a.lat), parseFloat(a.lon)];
          input.value = `${a.lat},${a.lon}`;
          suggestions.innerHTML = '';
        };
        suggestions.appendChild(div);
      });
    }
  };

  // Karte auswählen
  document.getElementById('quick-dest-map-pick').onclick = () => {
    quickOverlay.style.display = 'none';
    map.once('click', e => {
      destCoords = [e.latlng.lat, e.latlng.lng];
      alert(`Route zum Zielpunkt (${e.latlng.lat.toFixed(5)},${e.latlng.lng.toFixed(5)}) wird geplant (Demo).`);
      map.getContainer().style.cursor = "";
    });
    map.getContainer().style.cursor = "crosshair";
  };

  document.getElementById('quick-route-cancel').onclick = () => quickOverlay.style.display = 'none';
  document.getElementById('quick-multiday').onclick = () => {
    quickOverlay.style.display = 'none';
    window.location.href = "/plan.html#tour-details";
  };
  document.getElementById('quick-route-plan').onclick = () => {
    if (!destCoords) {
      alert("Bitte Zielkoordinaten oder Adresse wählen!");
      return;
    }
    alert("Route zum Zielpunkt wird geplant (Demo).");
    quickOverlay.style.display = 'none';
  };
});

function addQuickSpot(category, lat, lng) {
  const emoji = category === "Wasserstelle" ? "💧" :
                category === "Rastplatz" ? "🌳" :
                category === "Toilette" ? "🚻" :
                category === "Kneipe" ? "🍺" :
                category === "Krankenhaus" ? "🏥" :
                category === "Restaurant" ? "🍽️" :
                category === "Werkstatt" ? "🔧" :
                category === "Post" ? "📮" :
                category === "Cafe" ? "☕️" : "📍";
  const info = `${emoji} ${category}`;
  if (typeof spots !== "undefined" && typeof map !== "undefined" && typeof spotIcon === "function") {
    spots.push({lat, lng, info, emoji, category});
    const marker = L.marker([lat, lng], {icon: spotIcon(emoji)}).addTo(map).bindPopup(info);
    map.setView([lat, lng], 16);
    marker.openPopup();
  }
}
// Event für Mitfahrer-Finder Button
document.getElementById('find-partners').addEventListener('click', () => {
  if (typeof map === "undefined" || typeof riders === "undefined") {
    alert("Karte oder Mitfahrer-Daten sind noch nicht geladen.");
    return;
  }

  const myPos = map.getCenter();
  const nearby = riders.filter(r => {
    const pos = r.marker.getLatLng();
    const dist = map.distance([myPos.lat, myPos.lng], [pos.lat, pos.lng]);
    return dist < 5000; // 5 km Radius
  });

  alert(`${nearby.length} Mitfahrer:innen in der Nähe gefunden (Demo).`);
});

// --- Demo Log-Daten ---
let logs = [
  {
    author: "Anna",
    date: "2025-07-04 09:12",
    content: "Had such a wonderful ride through the Spreewald today! The weather was absolutely perfect and we met so many kind people along the way. 🌳🚴‍♂️🌞 Stopped for lunch by the river and enjoyed the peaceful scenery. It’s days like these that remind me why I love cycling so much. Totally recommend the route for anyone looking for a mix of nature and adventure!",
    likes: 2
  },
  {
    author: "Lena",
    date: "2025-07-05 17:28",
    content: "Explored the Brandenburg lake district today and it was breathtaking! The trail took us past shimmering lakes, dense forests, and through a few quiet villages. Even caught a glimpse of a deer near the path. Took plenty of breaks and enjoyed some local snacks. Can’t wait to do this route again with more friends next time!",
    likes: 3
  },
  {
    author: "Jakob",
    date: "2025-07-06 14:52",
    content: "What an adventure! Rode from Berlin to the outskirts of Potsdam and back. The heat was intense but the scenery made up for it. Found a small bakery hidden in a village that served the best apple strudel I’ve ever had. Got a flat tire halfway through, but a kind passerby helped me out. A great day on the bike overall!",
    likes: 4
  },
  {
    author: "Nora",
    date: "2025-07-07 10:19",
    content: "Joined a group ride through the Havelland region today and it turned into one of the best tours I’ve done so far! We cycled through sunflower fields, had coffee at a lovely old train station café, and shared stories with fellow riders. Such an inspiring group of people. Already looking forward to the next meetup!",
    likes: 5
  },
  {
    author: "Tim",
    date: "2025-07-08 15:35",
    content: "Took the long route along the Oder river and wow—what a ride. Beautiful landscapes, a calm breeze, and that golden hour glow towards the end made it unforgettable. Met a fellow cyclist from Denmark and we ended up riding together for a while. Moments like this make solo travel feel much less lonely.",
    likes: 3
  }
];

let logsShown = 2;
function renderLogs() {
  const logList = document.getElementById('log-list');
  logList.innerHTML = '';

  const maxLen = 180;
  logs.slice(0, logsShown).forEach((log) => {
    if (!log.routeId && savedTours.length) {
      log.routeId = savedTours[Math.floor(Math.random() * savedTours.length)].id;
    }
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    const isLong = log.content.length > maxLen;
    const shortText = isLong ? log.content.slice(0, maxLen) + '…' : log.content;
    const contentHtml = isLong
      ? `<span class="content">${shortText}</span> <span class="toggle-btn">Show more</span>`
      : `<span class="content">${log.content}</span>`;
    
    // Datum schön formatieren
    const dateObj = new Date(log.date);
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    entry.innerHTML = `
      <div class="author">
        <a href="/profile.html?user=${encodeURIComponent(log.author)}" class="profile-link">${log.author}</a>
      </div>
      <div class="date">${dateStr}</div>
      ${contentHtml}
      <button class="show-route-btn">Show route</button>
    `;
    
    if (isLong) {
      const toggle = entry.querySelector('.toggle-btn');
      const contentSpan = entry.querySelector('.content');
      toggle.onclick = () => {
        if (toggle.textContent === "Show more") {
          contentSpan.textContent = log.content;
          toggle.textContent = "Show less";
          entry.classList.add('expanded');
        } else {
          contentSpan.textContent = shortText;
          toggle.textContent = "Show more";
          entry.classList.remove('expanded');
        }
      };
    }
    
    // Show route Button
    const showRouteBtn = entry.querySelector('.show-route-btn');
    showRouteBtn.onclick = () => {
      scrollToMap();
      const route = savedTours.find(t => t.id === log.routeId);
      if (route) {
        document.querySelector(`.show-route-btn[data-tour="${route.id}"]`)?.click();
      } else {
        const randomTour = savedTours[Math.floor(Math.random() * savedTours.length)];
        document.querySelector(`.show-route-btn[data-tour="${randomTour.id}"]`)?.click();
      }
    };

    logList.appendChild(entry);
  });

  // Buttons anzeigen / verstecken
  const loadMoreBtn = document.getElementById('load-more-logs');
  const showLessBtn = document.getElementById('show-less-logs');

  loadMoreBtn.style.display = logsShown < logs.length ? 'inline-block' : 'none';
  showLessBtn.style.display = logsShown > 2 ? 'inline-block' : 'none';
}

  document.getElementById('load-more-logs').onclick = () => {
  logsShown += 3; // Oder beliebige Anzahl zum Nachladen
  if (logsShown > logs.length) logsShown = logs.length;
  renderLogs();
};

document.getElementById('show-less-logs').onclick = () => {
  logsShown = 2;
  renderLogs();
};

// Log erstellen über Plus-Menü
document.getElementById('add-log').addEventListener('click', () => {
  plusMenu.style.display = 'none';
  quickOverlayContent.innerHTML = `
    <h4>Create new log entry</h4>
    <input id="log-author" type="text" placeholder="Your name" required style="margin-bottom:0.5em;">
    <textarea id="log-content" rows="5" placeholder="What do you want to share?" required style="width:100%;"></textarea>
    <div class="quick-form-actions">
      <button id="log-save-btn" type="button">Post</button>
      <button id="log-cancel-btn" type="button" class="close-btn">Cancel</button>
    </div>
  `;
  quickOverlay.style.display = 'flex';
  document.getElementById('log-cancel-btn').onclick = () => quickOverlay.style.display = 'none';
  document.getElementById('log-save-btn').onclick = () => {
    const author = document.getElementById('log-author').value.trim() || "Anonymous";
    const content = document.getElementById('log-content').value.trim();
    if (!content) {
      alert("Please enter some text!");
      return;
    }
    const now = new Date();
    const date = now.toISOString();
    const routeId = savedTours[Math.floor(Math.random() * savedTours.length)]?.id;
    logs.unshift({author, date, content, routeId});
    quickOverlay.style.display = 'none';
    renderLogs();
  };
});


function showJoinHint(tourName, creator) {
  let hint = document.getElementById('join-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'join-hint';
    hint.style.position = 'fixed';
    hint.style.left = '50%';
    hint.style.bottom = '100px';
    hint.style.transform = 'translateX(-50%)';
    hint.style.background = '#000';
    hint.style.color = '#fff';
    hint.style.padding = '0.8em 1.5em';
    hint.style.borderRadius = '1.5em';
    hint.style.fontSize = '1.1em';
    hint.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
    hint.style.zIndex = 9999;
    hint.style.pointerEvents = 'none';
    document.body.appendChild(hint);
  }
  hint.textContent = `You send a request to join the tour by "${tourName}". ${creator} Received your request, wait until he accepts.`;
  hint.style.display = 'block';
  hint.style.opacity = '1';
  setTimeout(() => {
    hint.style.opacity = '0';
    setTimeout(() => { hint.style.display = 'none'; }, 600);
  }, 3500);
}

// Schließen des Plus-Menüs bei Klick außerhalb
document.addEventListener('mousedown', (e) => {
  const plusMenu = document.getElementById('plus-menu');
  const plusBtn = document.getElementById('plus-button');
  if (
    plusMenu.style.display === 'flex' &&
    !plusMenu.contains(e.target) &&
    e.target !== plusBtn
  ) {
    plusMenu.style.display = 'none';
  }
});

renderLogs();
updateTourFeed();

function scrollToMap() {
  const mapContainer = document.getElementById('map-container-start') || document.getElementById('map');
  if (mapContainer) {
    mapContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

});
