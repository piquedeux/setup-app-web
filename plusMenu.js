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
    <h4>Schnell Spot hinzufügen</h4>
    <label for="quick-spot-category">Kategorie</label>
    <select id="quick-spot-category" required>
      <option value="">Bitte wählen</option>
      <option value="Wasserstelle">💧 Wasserstelle</option>
      <option value="Rastplatz">🌳 Rastplatz</option>
      <option value="Toilette">🚻 Toilette</option>
      <option value="Cafe">🍽️ Café</option>
    </select>
    <div class="quick-form-actions">
      <button id="quick-spot-here" type="button">Spot hier hinzufügen</button>
      <button id="quick-spot-manual" type="button">Manuell hinzufügen</button>
      <button id="quick-spot-cancel" type="button" class="close-btn">Abbrechen</button>
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
    <label for="quick-dest">Zielpunkt (Lat,Lon)</label>
    <input id="quick-dest" type="text" placeholder="z.B. 53.9,14.1" required>
    <div class="quick-form-actions">
      <button id="quick-route-plan" type="button">Route planen</button>
      <button id="quick-multiday" type="button">Mehrtagestour planen</button>
      <button id="quick-route-cancel" type="button" class="close-btn">Abbrechen</button>
    </div>
  `;
  quickOverlay.style.display = 'flex';

  document.getElementById('quick-route-cancel').onclick = () => quickOverlay.style.display = 'none';
  document.getElementById('quick-multiday').onclick = () => {
    quickOverlay.style.display = 'none';
    window.location.href = "/plan.html#tour-details";
  };
  document.getElementById('quick-route-plan').onclick = () => {
    const dest = document.getElementById('quick-dest').value.trim();
    if (!dest.match(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/)) {
      alert("Bitte Zielkoordinaten im Format Lat,Lon eingeben!");
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
