const MOODS = ["happy", "sad", "chill", "focused", "pumped"];
const MOCK = {
    happy: [
      { title: "Sunroof", artist: "Nicky Youre" },
      { title: "Good as Hell", artist: "Lizzo" },
      { title: "Classic", artist: "MKTO" },
      { title: "Dynamite", artist: "BTS" },
      { title: "Levitating", artist: "Dua Lipa" },
    ],
    sad: [
      { title: "Someone Like You", artist: "Adele" },
      { title: "drivers license", artist: "Olivia Rodrigo" },
      { title: "Fix You", artist: "Coldplay" },
      { title: "Jealous", artist: "Labrinth" },
      { title: "I Fall Apart", artist: "Post Malone" },
    ],
    chill: [
      { title: "Coffee", artist: "beabadoobee" },
      { title: "Lost in Japan", artist: "Shawn Mendes" },
      { title: "location", artist: "Khalid" },
      { title: "idontwannabeyouanymore", artist: "Billie Eilish" },
      { title: "Pink + White", artist: "Frank Ocean" },
    ],
    focused: [
      { title: "Weightless", artist: "Marconi Union" },
      { title: "Sunset Lover", artist: "Petit Biscuit" },
      { title: "Geography", artist: "Tom Misch" },
      { title: "A Moment Apart", artist: "ODESZA" },
      { title: "Experience", artist: "Ludovico Einaudi" },
    ],
    pumped: [
      { title: "POWER", artist: "Kanye West" },
      { title: "Till I Collapse", artist: "Eminem" },
      { title: "HUMBLE.", artist: "Kendrick Lamar" },
      { title: "Lose Yourself", artist: "Eminem" },
      { title: "SICKO MODE", artist: "Travis Scott" },
    ],
  };
  
function renderMoods() {
  // grab the div with id="moods"
  const container = document.getElementById("moods");
  // loop through each mood
  MOODS.forEach(function(mood) {
    // make a new button
    const btn = document.createElement("button");
    btn.innerText = mood;
    // when clicked, call showMood(mood)
    btn.addEventListener("click", function() {
      showMood(mood);
    });
    // add the button into the container div
    container.appendChild(btn);
  });
}
function showMood(mood) {
  const box = document.getElementById("results");
  box.textContent = "Loading...";
  fetch(`http://localhost:3000/api/mood/${mood}`)
    .then(res => res.json())
    .then(({ tracks }) => {
      renderResults(tracks);
    })
    .catch(err => {
      console.error(err);
      box.textContent = "Error fetching tracks.";
    });
}
function renderResults(tracks) {
    const box = document.getElementById("results");
    box.innerHTML = ""; // clear old
  
    tracks.forEach(t => {
      const row = document.createElement("div");
      // give it a class if you want to style later, e.g. row.className = "track";
      row.className = "track";
      // simplest content:
      row.textContent = `${t.title} — ${t.artist}`;
  
      box.appendChild(row);
    });
  
    // empty state
    if (tracks.length === 0) {
      box.textContent = "No tracks for this mood (yet).";
    }
  }
renderMoods();