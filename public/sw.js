const CACHE_NAME = "oud-cache-v2";
const BASE = self.registration.scope; // Pages対応

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    // 🚫 manifest はキャッシュ禁止
    if (url.pathname.endsWith("/oud/manifest.json")) {
        return;
    }

    // OUD JSON はキャッシュOK
    if (url.pathname.includes("/oud/")) {
        event.respondWith(cacheFirst(event.request));
    }
});

async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);

    const cached = await cache.match(request);
    if (cached) return cached;

    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
}
