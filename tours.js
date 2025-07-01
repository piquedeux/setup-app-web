// tours.js

// Gespeicherte Touren mit Funktion zum Update des Feeds
const savedTours = [
  {id: 1, name: "Tour Berlin → Ostsee", days: 5, speed: 15, creator: "Moritz", multiDay: true},
  {id: 2, name: "Rundkurs Spreewald", days: 3, speed: 13, creator: "Anna", multiDay: false},
  {id: 3, name: "Brandenburg Seenplatte", days: 4, speed: 14, creator: "Tom", multiDay: true}
];

const tourList = document.getElementById('tour-list');

function updateTourFeed() {
  tourList.innerHTML = '';
  savedTours.forEach(tour => {
    const div = document.createElement('div');
    div.classList.add('tour-item');
    div.innerHTML = `
      <strong>${tour.name}</strong><br>
      Dauer: ${tour.days} Tage @ ${tour.speed} km/h<br>
      Erstellt von: <span class="profile">${tour.creator}</span><br>
      ${tour.multiDay ? "Mehrtägige Tour" : "Tages-Tour"}
    `;
    tourList.appendChild(div);
  });
}

updateTourFeed();
