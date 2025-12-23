const CACHE = "froject-v1";
const FILES = [
  "/froject-demo/",
  "/froject-demo/index.html",
  "/froject-demo/style.css",
  "/froject-demo/js/script.js",
  "/froject-demo/manifest.json",
  "/froject-demo/maskable-512.png",
  "/froject-demo/apple-touch-180.png"
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
