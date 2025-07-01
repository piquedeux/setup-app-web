// tours.js

// Gespeicherte Touren mit Funktion zum Update des Feeds
const savedTours = [
  {id: 1, name: "Tour Berlin → Ostsee", days: 5, creator: "Moritz", multiDay: true},
  {id: 2, name: "Rundkurs Spreewald", days: 3, creator: "Anna", multiDay: false},
  {id: 3, name: "Brandenburg Seenplatte", days: 4, creator: "Tom", multiDay: true}
];

// Dummy Routendaten für die Map (muss zu den Namen passen)
const tourRoutes = {
  1: [
    [52.52, 13.4], [52.55, 13.45], [52.6, 13.5], [52.7, 13.6], [52.8, 13.7], [53.0, 13.8]
  ],
  2: [
    [51.85, 14.4], [51.87, 14.38], [51.89, 14.35], [51.9, 14.3], [51.93, 14.2], [51.95, 14.1]
  ],
  3: [
    [52.8, 13.2], [52.85, 13.3], [52.9, 13.4], [53.0, 13.5], [53.1, 13.6]
  ]
};

let currentTourRoute; // Für das Entfernen der alten Route

const tourList = document.getElementById('tour-list');

function updateTourFeed() {
  tourList.innerHTML = '';
  savedTours.forEa