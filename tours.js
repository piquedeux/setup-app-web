document.addEventListener("DOMContentLoaded", () => {
  // SVG Icon Helper Function
  const getSvgIconHtml = (svgFileName, size = 32, color = 'currentColor') => {
    // Assuming icons are in a folder named 'icon-set' at the root
    return `<img src="/icon-set/${svgFileName}" style="width:${size}px; height:${size}px; filter: drop-shadow(0 0 2px rgba(0,0,0,0.5)); color:${color};" alt="${svgFileName.split('.')[0]}">`;
  };

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
    const key = 'CFkN2tzFRlUROwVG93Cn';
    customMaptiler = L.maptiler.maptilerLayer({
      apiKey: key,
      style: "https://api.maptiler.com/maps/019812d7-655e-7fb6-bba3-ee3367765bbc/style.json",
    });
  } catch (err) {
    console.error("MapTiler konnte nicht geladen werden:", err);
    customMaptiler = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'); // Fallback
  }

  // Map Setup
  // Initial center and zoom can be global, clustering handles dense areas
  const map = L.map('map', {
    center: [0, 0], // Start centered globally
    zoom: 2,       // Low zoom to show global view
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

  // --- Marker Clustering Setup ---
  const markers = L.markerClusterGroup();
  map.addLayer(markers);

  // Spot Icons & Categories
  const spotIconMap = {
    "Wasserstelle": "water.svg",
    "Rastplatz": "restingspot.svg",
    "Toilette": "toilet.svg",
    "Cafe": "coffee.svg",
    "Werkstatt": "workshop.svg",
    "Pub": "bar.svg",
    "Krankenhaus": "hospital.svg",
    "Briefkasten": "postoffice.svg",
    "Restaurant": "restaurant.svg",
    "Camping": "camping.svg",
    "Great View": "greatview.svg",
    "Shelter": "shelter.svg",
    "Sleep Spot": "sleepspot.svg",
  };

  const spotCategories = Object.keys(spotIconMap);

  const spots = [];
  // Distribute spots globally
  for (let i = 0; i < 2000; i++) { // Increased number of spots for better global demonstration
    const lat = (Math.random() * 180) - 90; // -90 to +90
    const lng = (Math.random() * 360) - 180; // -180 to +180
    const category = spotCategories[Math.floor(Math.random() * spotCategories.length)];
    const svgFileName = spotIconMap[category] || 'X.svg';
    const spot = {
      lat,
      lng,
      info: `${category} #${i + 1}`,
      svg: svgFileName,
      category: category,
      id: `spot-${i}` // Added unique ID for tracking
    };
    spots.push(spot);
    // Add marker directly to the cluster group
    spot.marker = L.marker([spot.lat, spot.lng], { icon: L.divIcon({
      className: 'custom-div-icon',
      html: getSvgIconHtml(spot.svg, 28),
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    })}).bindPopup(spot.info);
    markers.addLayer(spot.marker);
  }

  // Fahrer generieren & Icons
  const directions = [
    [0.00015, 0],
    [-0.00015, 0],
    [0, 0.00015],
    [0, -0.00015],
    [0.0001, 0.0001],
    [0.0001, -0.0001],
    [-0.0001, 0.0001],
    [-0.0001, -0.0001]
  ];
  const riderColors = ["red", "gold", "blue", "green", "purple", "orange", "brown", "pink", "teal", "black"];
  const riders = [];
  // 50 additional riders distributed globally
  for (let i = 0; i < 50; i++) {
    const lat = (Math.random() * 180) - 90;
    const lng = (Math.random() * 360) - 180;
    const color = riderColors[i % riderColors.length];
    const dir = directions[i % directions.length];
    const rider = {
      id: `Rider${i + 1}`,
      pos: [lat, lng],
      color,
      speed: 0.00008 + Math.random() * 0.00012,
      dir
    };
    riders.push(rider);
    rider.marker = L.marker(rider.pos, { icon: L.divIcon({
      className: 'rider-div-icon',
      html: getSvgIconHtml('rider.svg', 32, color),
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    })}).bindPopup(`<b>${rider.id}</b><br>Speed: ${(rider.speed * 100000).toFixed(2)} km/h`); // Added direct popup for riders
    markers.addLayer(rider.marker); // Add rider markers to the cluster group
  }

  // Fahrer bewegen (Loop) - Movement will now be global
  function moveRiders() {
    riders.forEach(rider => {
      let { lat, lng } = rider.marker.getLatLng();
      lat += rider.dir[0] * rider.speed * 5000; // Increased movement factor
      lng += rider.dir[1] * rider.speed * 5000; // Increased movement factor

      // Wrap around the globe
      if (lat > 90) lat = -90 + (lat - 90);
      if (lat < -90) lat = 90 + (lat + 90);
      if (lng > 180) lng = -180 + (lng - 180);
      if (lng < -180) lng = 180 + (lng + 180);
      
      rider.marker.setLatLng([lat, lng]);
    });
  }
  setInterval(moveRiders, 1000); // Slower interval for better global visualization

  // --- ORS API Key ---
  const ORS_API_KEY = '5b3ce3597851110001cf6248263492386e3d40628c7dbf37a20f27f2';

  // --- Spots + Touren im LocalStorage ---
  // Dummy data for savedTours (can be merged with actual data if loaded from localStorage)
  let savedTours = [
    {
      id: "tour-js-1", // Added unique ID for JS-generated tours
      name: "Tour Berlin → Ostsee",
      days: 5,
      creator: "Moritz",
      multiDay: true,
      startCoords: [52.52508, 13.3694],
      endCoords: [54.0887, 12.1405]
    },
    {
      id: "tour-js-2",
      name: "Rundkurs Spreewald",
      days: 3,
      creator: "Anna",
      multiDay: false,
      startCoords: [51.8686, 13.9601],
      endCoords: [51.7563, 14.3329]
    },
    {
      id: "tour-js-3",
      name: "Brandenburg Seenplatte",
      days: 4,
      creator: "Tom",
      multiDay: true,
      startCoords: [52.4167, 12.5500],
      endCoords: [53.0981, 12.8927]
    }
  ];

  // --- Helper: Find Spot by Id ---
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

  // --- Get Route from ORS ---
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

  // --- Display Route ---
  function displayRoute(routeData, waypoints) {
    if (currentRouteLayer) map.removeLayer(currentRouteLayer);
    currentRouteMarkers.forEach(m => map.removeLayer(m));
    currentRouteMarkers = [];

    if (!routeData || !routeData.features || !routeData.features[0]) {
      alert("No route found!");
      return;
    }
    const coords = routeData.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
    const summary = routeData.features[0].properties.summary;

    currentRouteLayer = L.polyline(coords, { color: 'black', weight: 3 }).addTo(map);

    // Marker Start X
    currentRouteMarkers.push(
      L.marker(coords[0], {
        icon: L.divIcon({ className: '', html: '<span style="font-size: 28px;">X</span>', iconSize: [28, 28] })
      }).addTo(map).bindPopup("Start")
    );

    // Marker Target X
    currentRouteMarkers.push(
      L.marker(coords[coords.length - 1], {
        icon: L.divIcon({ className: '', html: '<span style="font-size: 28px;">X</span>', iconSize: [28, 28] })
      }).addTo(map).bindPopup("Target")
    );

    // Marker Waypoints X
    waypoints.forEach((wp, i) => {
      L.marker(wp, {
        icon: L.divIcon({ className: '', html: '<span style="font-size: 24px;">X</span>', iconSize: [24, 24] })
      }).addTo(map).bindPopup(`Waypoint ${i + 1}`);
    });

    map.fitBounds(coords);

    return summary;
  }

  // --- Update Tour Feed (MODIFIED TO APPEND) ---
  const renderedTourIds = new Set(); // Keep track of already rendered tours

  async function updateTourFeed() {
    const tourList = document.getElementById('tour-list');
    if (!tourList) return;

    // Iterate over savedTours and append only if not already rendered
    for (const tour of savedTours) {
      if (renderedTourIds.has(tour.id)) {
        continue; // Skip if already added by JS
      }

      const div = document.createElement('div');
      div.classList.add('tour-item');
      div.dataset.tourId = tour.id; // Add data attribute to identify this JS-generated tour

      let meetingPointText = '';
      if (tour.meetingPoint) {
        meetingPointText = `<br>📌 Meeting Point: ${tour.meetingPoint.name}`;
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

      // Event Listeners (same as before)
      div.querySelector('.join-tour-btn').addEventListener('click', e => {
        e.stopPropagation();
        showJoinHint(tour.name, tour.creator);
      });

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

        document.getElementById('meeting-map-pick').onclick = () => {
          quickOverlay.style.display = 'none';
          map.once('click', e => {
            selectMeeting([e.latlng.lat, e.latlng.lng], `${e.latlng.lat.toFixed(5)},${e.latlng.lng.toFixed(5)}`);
          });
          map.getContainer().style.cursor = "crosshair";
        };

        document.getElementById('meeting-cancel').onclick = () => quickOverlay.style.display = 'none';

        let meetingMarkers = [];
        function selectMeeting(coords, name) {
          tour.meetingPoint = { name, coord: coords };
          meetingMarkers.forEach(m => map.removeLayer(m));
          meetingMarkers = [];
          const marker = L.marker(coords, { icon: L.divIcon({ className: '', html: '<span style="font-size: 24px;">X</span>', iconSize: [24, 24] }) })
            .addTo(map)
            .bindPopup(`Meeting Point: ${name}`)
            .openPopup();
          meetingMarkers.push(marker);
          quickOverlay.style.display = 'none';
          updateTourFeed(); // Re-render to update meeting point text
          map.getContainer().style.cursor = "";
        }
      });

      div.querySelector('.show-route-btn').addEventListener('click', async e => {
        e.stopPropagation();
        scrollToMap();

        const startCoords = tour.startCoords;
        const endCoords = tour.endCoords;

        if (!startCoords || !endCoords) {
          alert("Start or destination not available!");
          return;
        }

        const coordinates = [
          [startCoords[1], startCoords[0]],
          [endCoords[1], endCoords[0]]
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
          alert("Error loading route: " + err);
          return;
        }

        if (!data || !data.features || !data.features[0]) {
          alert("Route could not be loaded. (ORS error)");
          console.log("ORS response:", data);
          return;
        }

        if (currentRouteLayer) map.removeLayer(currentRouteLayer);
        currentRouteMarkers.forEach(m => map.removeLayer(m));
        currentRouteMarkers = [];

        const coords = data.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
        const summary = data.features[0].properties.summary;

        currentRouteLayer = L.polyline(coords, { color: 'black', weight: 3 }).addTo(map);

        currentRouteMarkers.push(
          L.marker(coords[0], {
            icon: L.divIcon({ className: '', html: '<span style="font-size: 28px;">X</span>', iconSize: [28, 28] })
          }).addTo(map).bindPopup("Start")
        );

        currentRouteMarkers.push(
          L.marker(coords[coords.length - 1], {
            icon: L.divIcon({ className: '', html: '<span style="font-size: 28px;">X</span>', iconSize: [28, 28] })
          }).addTo(map).bindPopup("Target")
        );

        map.fitBounds(coords);

        const infoDiv = document.getElementById(`route-info-${tour.id}`);
        if (summary) {
          infoDiv.innerHTML = `Length: ${(summary.distance / 1000).toFixed(1)} km &nbsp; | &nbsp; Duration: ${(summary.duration / 3600).toFixed(1)} h`;
        }
      });

      tourList.appendChild(div);
      renderedTourIds.add(tour.id); // Mark this tour as rendered
    }
  }

  // plusMenu.js

  const plusBtn = document.getElementById('plus-button');
  const plusMenu = document.getElementById('plus-menu');
  const quickOverlay = document.getElementById('quick-overlay');
  const quickOverlayContent = document.getElementById('quick-overlay-content');

  plusBtn.addEventListener('click', () => {
    plusMenu.style.display = plusMenu.style.display === 'flex' ? 'none' : 'flex';
  });

  quickOverlay.addEventListener('mousedown', (e) => {
    if (e.target === quickOverlay) {
      quickOverlay.style.display = 'none';
    }
  });

  document.getElementById('add-spot').addEventListener('click', () => {
    plusMenu.style.display = 'none';
    const categoryOptions = Object.keys(spotIconMap).map(cat => `<option value="${cat}">${cat}</option>`).join('');
    quickOverlayContent.innerHTML = `
      <h4>Quick Add Spot</h4>
      <label for="quick-spot-category">Category</label>
      <select id="quick-spot-category" required>
        <option value="">Please select</option>
        ${categoryOptions}
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
        alert("Please select a category!");
        return;
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
          addQuickSpot(category, pos.coords.latitude, pos.coords.longitude);
        }, function() {
          alert("Location not available.");
        });
      } else {
        alert("Location not available.");
      }
      quickOverlay.style.display = 'none';
    };
  });

  document.getElementById('start-plan').addEventListener('click', () => {
    plusMenu.style.display = 'none';
    quickOverlayContent.innerHTML = `
      <h4>Quick Route Plan</h4>
      <input id="quick-dest" type="text" placeholder="Address or Coordinates" required>
      <div id="quick-dest-suggestions" class="suggestions"></div>
      <button id="quick-dest-map-pick" type="button">Pick on map</button>
      <div class="quick-form-actions">
        <button id="quick-route-plan" type="button">Plan route</button>
        <button id="quick-multiday" type="button">Plan multi-day tour</button>
        <button id="quick-route-cancel" type="button" class="close-btn">Cancel</button>
      </div>
    `;
    quickOverlay.style.display = 'flex';

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

    document.getElementById('quick-dest-map-pick').onclick = () => {
      quickOverlay.style.display = 'none';
      map.once('click', e => {
        destCoords = [e.latlng.lat, e.latlng.lng];
        alert(`Route to target point (${e.latlng.lat.toFixed(5)},${e.latlng.lng.toFixed(5)}) will be planned (Demo).`);
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
        alert("Please select target coordinates or address!");
        return;
      }
      alert("Route to target point will be planned (Demo).");
      quickOverlay.style.display = 'none';
    };
  });

  function addQuickSpot(category, lat, lng) {
    const svgFileName = spotIconMap[category] || 'X.svg';
    const info = `${category}`;
    if (typeof spots !== "undefined" && typeof map !== "undefined") {
      const newSpot = { lat, lng, info, svg: svgFileName, category, id: `spot-quick-${Date.now()}` }; // Unique ID for quick spots
      spots.push(newSpot);
      const marker = L.marker([lat, lng], { icon: L.divIcon({
        className: 'custom-div-icon',
        html: getSvgIconHtml(svgFileName, 28),
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      })}).bindPopup(info);
      markers.addLayer(marker); // Add new spot to the cluster group
      map.setView([lat, lng], 16);
      marker.openPopup();
    }
  }

  document.getElementById('find-partners').addEventListener('click', () => {
    if (typeof map === "undefined" || typeof riders === "undefined") {
      alert("Map or rider data not yet loaded.");
      return;
    }

    const myPos = map.getCenter();
    const nearby = riders.filter(r => {
      const pos = r.marker.getLatLng();
      const dist = map.distance([myPos.lat, myPos.lng], [pos.lat, pos.lng]);
      return dist < 500000; // Increased radius for global context (500km)
    });

    alert(`${nearby.length} Riders nearby. Send them a request`);
  });

  // Dummy data for logs (can be merged with actual data if loaded from localStorage)
  let logs = [
    {
      author: "Anna",
      date: "2025-07-04 09:12",
      content: "Had such a wonderful ride through the Spreewald today! The weather was absolutely perfect and we met so many kind people along the way. 🌳🚴‍♂️🌞 Stopped for lunch by the river and enjoyed the peaceful scenery. It’s days like these that remind me why I love cycling so much. Totally recommend the route for anyone looking for a mix of nature and adventure!",
      likes: 2,
      id: "log-js-1" // Added unique ID for JS-generated logs
    },
    {
      author: "Lena",
      date: "2025-07-05 17:28",
      content: "Explored the Brandenburg lake district today and it was breathtaking! The trail took us past shimmering lakes, dense forests, and through a few quiet villages. Even caught a glimpse of a deer near the path. Took plenty of breaks and enjoyed some local snacks. Can’t wait to do this route again with more friends next time!",
      likes: 3,
      id: "log-js-2"
    },
    {
      author: "Jakob",
      date: "2025-07-06 14:52",
      content: "What an adventure! Rode from Berlin to the outskirts of Potsdam and back. The heat was intense but the scenery made up for it. Found a small bakery hidden in a village that served the best apple strudel I’ve ever had. Got a flat tire halfway through, but a kind passerby helped me out. A great day on the bike overall!",
      likes: 4,
      id: "log-js-3"
    },
    {
      author: "Nora",
      date: "2025-07-07 10:19",
      content: "Joined a group ride through the Havelland region today and it turned into one of the best tours I’ve done so far! We cycled through sunflower fields, had coffee at a lovely old train station café, and shared stories with fellow riders. Such an inspiring group of people. Already looking forward to the next meetup!",
      likes: 5,
      id: "log-js-4"
    },
    {
      author: "Tim",
      date: "2025-07-08 15:35",
      content: "Took the long route along the Oder river and wow—what a ride. Beautiful landscapes, a calm breeze, and that golden hour glow towards the end made it unforgettable. Met a fellow cyclist from Denmark and we ended up riding together for a while. Moments like this make solo travel feel much less lonely.",
      likes: 3,
      id: "log-js-5"
    }
  ];

  let logsShown = 2; // Initial number of JS logs to show

  const renderedLogIds = new Set(); // Keep track of already rendered logs

  // --- Render Logs (MODIFIED TO APPEND) ---
  function renderLogs() {
    const logList = document.getElementById('log-list');
    if (!logList) return;

    // Filter to only display logs not yet rendered by JS
    const logsToRender = logs.filter(log => !renderedLogIds.has(log.id));

    const maxLen = 180;
    logsToRender.slice(0, logsShown).forEach((log) => {
      if (!log.routeId && savedTours.length) {
        // Assign a random tour ID from the JS-generated tours
        log.routeId = savedTours[Math.floor(Math.random() * savedTours.length)].id;
      }
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.dataset.logId = log.id; // Add data attribute to identify this JS-generated log

      const isLong = log.content.length > maxLen;
      const shortText = isLong ? log.content.slice(0, maxLen) + '…' : log.content;
      const contentHtml = isLong
        ? `<span class="content">${shortText}</span> <span class="toggle-btn">Show more</span>`
        : `<span class="content">${log.content}</span>`;

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

      const showRouteBtn = entry.querySelector('.show-route-btn');
      showRouteBtn.onclick = () => {
        scrollToMap();
        // Find the corresponding tour based on ID
        const route = savedTours.find(t => t.id === log.routeId);
        if (route) {
          // Trigger the click event on the dynamically created tour item's button
          document.querySelector(`.show-route-btn[data-tour="${route.id}"]`)?.click();
        } else {
          // Fallback if no specific route found (e.g., for dummy content)
          const randomTour = savedTours[Math.floor(Math.random() * savedTours.length)];
          document.querySelector(`.show-route-btn[data-tour="${randomTour.id}"]`)?.click();
        }
      };

      logList.appendChild(entry);
      renderedLogIds.add(log.id); // Mark this log as rendered
    });

    const loadMoreBtn = document.getElementById('load-more-logs');
    const showLessBtn = document.getElementById('show-less-logs');

    loadMoreBtn.style.display = logsShown < logs.length ? 'inline-block' : 'none';
    showLessBtn.style.display = logsShown > 2 ? 'inline-block' : 'none';
  }

  document.getElementById('load-more-logs').onclick = () => {
    logsShown += 3;
    if (logsShown > logs.length) logsShown = logs.length;
    renderLogs(); // Call renderLogs again to append more
  };

  document.getElementById('show-less-logs').onclick = () => {
    logsShown = 2;
    // To 'show less', we need to remove the extra JS-added logs
    const logList = document.getElementById('log-list');
    if (logList) {
      // Remove all JS-added logs, then re-render the initial set
      Array.from(logList.children).forEach(child => {
        if (child.dataset.logId && logs.some(log => log.id === child.dataset.logId)) {
          child.remove();
        }
      });
      renderedLogIds.clear(); // Clear the set to allow re-rendering
      renderLogs();
    }
  };

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
      // Add new log to the beginning of the logs array
      const newLog = { author, date, content, routeId, id: `log-new-${Date.now()}` };
      logs.unshift(newLog);
      quickOverlay.style.display = 'none';
      
      // To show the new log immediately at the top, clear and re-render all logs
      const logList = document.getElementById('log-list');
      if(logList) {
        logList.innerHTML = ''; // Clear all existing (dummy and JS-added)
        renderedLogIds.clear(); // Reset tracking
        logsShown = Math.max(logsShown, 3); // Ensure at least 3 are shown if a new one is added
        renderLogs(); // Re-render from scratch
      }
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
    hint.textContent = `You sent a request to join the tour by "${tourName}". ${creator} received your request, wait until they accept.`;
    hint.style.display = 'block';
    hint.style.opacity = '1';
    setTimeout(() => {
      hint.style.opacity = '0';
      setTimeout(() => { hint.style.display = 'none'; }, 600);
    }, 3500);
  }

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

  // Initial calls to populate dynamic content, appending to any existing HTML dummy content
  updateTourFeed();
  renderLogs();

  function scrollToMap() {
    const mapContainer = document.getElementById('map-container-start') || document.getElementById('map');
    if (mapContainer) {
      mapContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

});
