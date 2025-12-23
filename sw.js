const CACHE = "froject-v1";
const FILES = [
  "/",
  "/index.html",
  "/style.css",
  "/js/script.js",
  "/manifest.json",
  "/maskable-512.png",
  "/apple-touch-180.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES))
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
