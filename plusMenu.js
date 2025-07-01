// plusMenu.js

const plusBtn = document.getElementById('plus-button');
const plusMenu = document.getElementById('plus-menu');

plusBtn.addEventListener('click', () => {
  plusMenu.style.display = plusMenu.style.display === 'flex' ? 'none' : 'flex';
});

document.getElementById('start-plan').addEventListener('click', () => {
  alert("Route planen (noch in Arbeit)");
  plusMenu.style.display = 'none';
});

document.getElementById('add-spot').addEventListener('click', () => {
  plusMenu.style.display = 'none';
  showSpotOverlay();
});

// Klick außerhalb Menü schließt das Menü
document.addEventListener('click', (e) => {
  if (!plusMenu.contains(e.target) && e.target !== plusBtn) {
    plusMenu.style.display = 'none';
  }
});

// Spot hinzufügen Overlay und Logik
const spotOverlay = document.getElementById('spot-overlay');
const spotForm = document.getElementById('spot-form');
const mapSelectToggle = document.getElementById('map-select-toggle');

let mapSelectMode = false;
let tempMarker = null;

function showSpotOverlay() {
  spotOverlay.style.display = 'flex';
  spotForm.reset();
  mapSelectToggle.checked = false;
  mapSelectMode = false;
  if(tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
}

document.getElementById('spot-cancel').addEventListener('click', () => {
  spotOverlay.style.display = 'none';
  if(tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
});

mapSelectToggle.addEventListener('change', (e) => {
  mapSelectMode = e.target.checked;
  if(mapSelectMode) {
    alert("Klicke auf die Karte, um den Spot zu setzen.");
  }
  if(tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
});

map.on('click', (e) => {
  if (mapSelectMode) {
    if(tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker(e.latlng, {draggable: true}).addTo(map);
  }
});

spotForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const category = document.getElementById('spot-category').value;
  const name = document.getElementById('spot-name').value.trim();
  const notes = document.getElementById('spot-notes').value.trim();

  if(!category || !name) {
    alert("Bitte Kategorie und Name angeben.");
    return;
  }

  if(mapSelectMode && !tempMarker) {
    alert("Bitte wähle einen Punkt auf der Karte aus.");
    return;
  }

  const latlng = mapSelectMode ? tempMarker.getLatLng() : map.getCenter();

  const newSpot = {
    lat: latlng.lat,
    lng: latlng.lng,
    info: `${category} – ${name}${notes ? "<br>" + notes : ""}`,
    emoji: category === "Wasserstelle" ? "💧" :
           category === "Rastplatz" ? "🌳" :
           category === "Toilette" ? "🚻" :
           category === "Cafe" ? "🍽️" : "📍",
    category
  };
  spots.push(newSpot);

  // Neuen Marker hinzufügen
  newSpot.marker = L.marker([newSpot.lat, newSpot.lng], {icon: spotIcon(newSpot.emoji)}).addTo(map).bindPopup(newSpot.info);

  alert("Spot hinzugefügt!");
  spotOverlay.style.display = 'none';

  if(tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
});
