const CACHE_NAME = "oud-cache-v1";
const BASE = self.registration.scope; // Pages対応

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(self.clients.claim());
});

/* OUD JSON のみキャッシュ */
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (!url.pathname.includes("/oud/")) return;

  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  const cached = await cache.match(request);
  if (cached) return cached;

  const fresh = await fetch(request);
  cache.put(request, fresh.clone());
  return fresh;
}
