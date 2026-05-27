const CACHE = "froject-v2";
const FILES = [
  "/froject-demo/",
  "/froject-demo/index.html",
  "/froject-demo/style.css",
  "/froject-demo/fix.css",
  "/froject-demo/script.js",
  "/froject-demo/manifest.json",
  "/froject-demo/maskable-512.png",
  "/froject-demo/apple-touch-180.png"
];

self.addEventListener("install", (e) => {
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const reqUrl = new URL(e.request.url);
  const isSameOrigin = reqUrl.origin === self.location.origin;
  const isAppAsset = isSameOrigin && reqUrl.pathname.startsWith("/froject-demo/");

  if (!isAppAsset) return;

  if (reqUrl.pathname.endsWith("/index.html") || reqUrl.pathname === "/froject-demo/") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((res) => res || caches.match("/froject-demo/index.html")))
    );
    return;
  }

    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, copy));
        return res;
      });
    })
  );
});
