// -----------------------------
// Config
// -----------------------------
const API_BASE = "http://localhost:3333"; // backend index.js listens here
const MOODS = ["Happy", "Sad", "Chill", "Focused", "Pumped"];

// Cache DOM
const moodsBox   = document.getElementById("moods");
const resultsBox = document.getElementById("results");
const refreshBtn = document.getElementById("refresh");

let lastMood = null;

// -----------------------------
// UI helpers
// -----------------------------
function setLoading(isLoading) {
  resultsBox.setAttribute("aria-busy", String(isLoading));
  resultsBox.textContent = isLoading ? "Loading…" : "";
}
function setError(msg) {
  resultsBox.setAttribute("aria-busy", "false");
  resultsBox.textContent = msg || "Something went wrong.";
}

// -----------------------------
// Rendering
// -----------------------------
function renderResults(tracks = []) {
  resultsBox.innerHTML = "";
  resultsBox.setAttribute("aria-busy", "false");

  if (!tracks.length) {
    resultsBox.textContent = "No tracks found. Try Refresh.";
    return;
  }

  tracks.forEach(t => {
    const card = document.createElement("div");
    card.className = "track";

    const img = document.createElement("img");
    img.alt = `${t.title} cover`;
    img.src = t.imageUrl || "https://via.placeholder.com/64?text=♪";

    const meta = document.createElement("div");
    meta.className = "meta";

    const title = document.createElement("div");
    title.className = "title";

    if (t.spotifyUrl) {
      const a = document.createElement("a");
      a.href = t.spotifyUrl;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = t.title;
      title.appendChild(a);
    } else {
      title.textContent = t.title;
    }

    const artist = document.createElement("div");
    artist.className = "artist";
    artist.textContent = t.artist || "Unknown";

    meta.appendChild(title);
    meta.appendChild(artist);

    if (t.previewUrl) {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = t.previewUrl;
      meta.appendChild(audio);
    }

    card.appendChild(img);
    card.appendChild(meta);
    resultsBox.appendChild(card);
  });
}

// -----------------------------
// API calls
// -----------------------------
async function fetchMood(mood) {
  const res = await fetch(`${API_BASE}/api/mood/${encodeURIComponent(mood)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json(); // { mood, tracks, meta? }
}

// -----------------------------
// Events
// -----------------------------
function onMoodClick(mood) {
  lastMood = mood;
  setLoading(true);
  fetchMood(mood)
    .then(({ tracks }) => renderResults(tracks))
    .catch(err => setError(err.message));
}

function renderMoods() {
  moodsBox.innerHTML = "";
  MOODS.forEach((mood) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = mood;
    btn.addEventListener("click", () => onMoodClick(mood));
    moodsBox.appendChild(btn);
  });
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    if (!lastMood) return setError("Pick a mood first.");
    onMoodClick(lastMood);
  });
}

// Optional: number keys 1–5 trigger corresponding mood button
document.addEventListener("keydown", (e) => {
  const num = parseInt(e.key, 10);
  if (!Number.isInteger(num)) return;
  const btns = Array.from(document.querySelectorAll("#moods button"));
  if (num >= 1 && num <= btns.length) btns[num - 1].click();
});

// -----------------------------
// Init
// -----------------------------
renderMoods();
// onMoodClick(MOODS[0]); // optionally auto-load first mood
