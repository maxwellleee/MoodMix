// ─────────────────────────────
// Env & Deps
// ─────────────────────────────
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
// Allow requests from any frontend (simple for local dev)
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3333;

// ─────────────────────────────
// Client-Credentials Token Cache
// ─────────────────────────────
let cachedToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) return cachedToken;

  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Missing Spotify credentials in .env");

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");

  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`Token request failed: ${resp.status} ${text}`);

  const data = JSON.parse(text);
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // refresh early
  return cachedToken;
}

// ─────────────────────────────
// Mood → Query Rotation
// ─────────────────────────────
const MOOD_TO_QUERIES = {
  happy:   ["upbeat pop", "feel good pop", "summer pop", "dance pop hits"],
  sad:     ["sad acoustic", "sad piano", "melancholic pop", "emotional ballads"],
  chill:   ["lofi chill", "chill beats", "chillhop", "coffee shop vibes"],
  focused: ["ambient instrumental", "deep focus", "study beats", "minimal electronic"],
  pumped:  ["high energy edm", "workout hits", "dance bangers", "hype rap"],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomOffset(maxPages = 6) {
  const page = Math.floor(Math.random() * maxPages); // 0..maxPages-1
  return page * 10;
}

function formatTracks(items = []) {
  return items.map(t => ({
    title: t.name,
    artist: t.artists?.[0]?.name || "Unknown",
    previewUrl: t.preview_url || "",
    imageUrl: t.album?.images?.[0]?.url || "",
    spotifyUrl: t.external_urls?.spotify || "",
  }));
}

// ─────────────────────────────
// Routes
// ─────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true }));

// Search-only mood endpoint with rotation + random offset (no login needed)
app.get("/api/mood/:mood", async (req, res) => {
  const mood = req.params.mood;

  try {
    const token = await getSpotifyToken();

    const queries = MOOD_TO_QUERIES[mood] || [mood || "pop"];
    const q = pickRandom(queries);
    const offset = randomOffset(6); // steps of 10
    const limit = 10;

    const url =
      `https://api.spotify.com/v1/search` +
      `?q=${encodeURIComponent(q)}` +
      `&type=track` +
      `&limit=${limit}` +
      `&offset=${offset}` +
      `&market=US`;

    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    const text = await resp.text();
    if (!resp.ok) {
      return res.status(resp.status).send(text || "spotify_search_error");
    }

    const data = JSON.parse(text);
    const tracks = formatTracks(data.tracks?.items);

    return res.json({
      mood,
      tracks,
      meta: { provider: "spotify.search", query: q, offset }
    });
  } catch (e) {
    console.error("ROUTE ERR:", e);
    res.status(500).json({ error: "server_error", message: String(e) });
  }
});

// 404 helper
app.use((req, res) => {
  res.status(404).json({ error: "not_found", path: req.originalUrl });
});

// ─────────────────────────────
// Start
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`MoodMix API running at http://localhost:${PORT}`);
});
