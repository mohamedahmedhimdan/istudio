const CACHE = "istudio-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./about.html",
  "./track.html",
  "./inspire.html",
  "./students.html",
  "./smart.html",
  "./experience.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/i18n.js",
  "./manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(ASSETS.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const u = e.request.url;
  if (u.includes("/.netlify/functions/")) return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => cached))
  );
});
