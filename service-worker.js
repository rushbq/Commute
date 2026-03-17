const APP_SHELL_CACHE = "commute-checker-shell-v1";
const RUNTIME_CACHE = "commute-checker-runtime-v1";
const MAPS_CACHE = "commute-checker-maps-v1";
const APP_SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./style/main.css",
  "./src/config.js",
  "./src/map.js",
  "./src/routeService.js",
  "./src/ui.js",
  "./src/app.js",
  "./data/routes.json",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon.svg",
  "./assets/maskable-icon.svg"
];
const MAPS_HOSTS = new Set(["maps.googleapis.com", "maps.gstatic.com"]);
const FONT_HOSTS = new Set(["fonts.googleapis.com", "fonts.gstatic.com"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== APP_SHELL_CACHE &&
            cacheName !== RUNTIME_CACHE &&
            cacheName !== MAPS_CACHE
          ) {
            return caches.delete(cacheName);
          }

          return Promise.resolve();
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request, APP_SHELL_CACHE));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request, RUNTIME_CACHE));
    return;
  }

  if (MAPS_HOSTS.has(url.hostname) || FONT_HOSTS.has(url.hostname)) {
    event.respondWith(staleWhileRevalidate(event.request, MAPS_CACHE));
  }
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || cache.match("./index.html");
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  if (response && (response.ok || response.type === "opaque")) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const networkResponsePromise = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || networkResponsePromise;
}
