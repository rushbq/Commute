// mmvmbwo6 在 build 時由 Vite 插件替換為 build timestamp（如 "lzqk0g8"）
// 每次 deploy 都會產生新版本，讓 activate 自動清除舊快取
const CACHE_VERSION = "mmvmbwo6";
const APP_SHELL_CACHE = `commute-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `commute-runtime-${CACHE_VERSION}`;
const MAPS_CACHE = `commute-maps-${CACHE_VERSION}`;

const APP_SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./data/routes.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
const MAPS_HOSTS = new Set(["maps.googleapis.com", "maps.gstatic.com"]);
const FONT_HOSTS = new Set(["fonts.googleapis.com", "fonts.gstatic.com"]);

// 安裝：預先快取 App Shell，但不呼叫 skipWaiting。
// 等待 App 通知才切換，讓使用者可以選擇何時更新。
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS)));
});

// 啟動：清除所有舊版快取（名稱不符合目前版本者）
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            const isCurrentCache =
              cacheName === APP_SHELL_CACHE ||
              cacheName === RUNTIME_CACHE ||
              cacheName === MAPS_CACHE;
            return isCurrentCache ? null : caches.delete(cacheName);
          })
        )
      )
      .then(() => self.clients.claim())
      .then(() => {
        // 通知所有 tab：新版本已就緒
        return self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((client) => client.postMessage({ type: "SW_ACTIVATED" }));
        });
      })
  );
});

// 接收 App 的指令：SKIP_WAITING 讓新 SW 立即接管
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
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
    const cached = await cache.match(request);
    return cached || cache.match("./index.html");
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response && (response.ok || response.type === "opaque")) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkResponsePromise = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkResponsePromise;
}
