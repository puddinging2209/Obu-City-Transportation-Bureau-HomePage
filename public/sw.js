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

    // manifest.json は常にネットワーク
    if (url.pathname.endsWith("/oud/manifest.json")) {
        event.respondWith(fetch(event.request, { cache: "no-store" }));
        return;
    }

    // OUD 本体のみキャッシュ対象
    if (url.pathname.includes("/oud/")) {
        event.respondWith(cacheThenUpdate(event.request));
    }
});


async function cacheThenUpdate(request) {
    const cache = await caches.open(CACHE_NAME);

    const cached = await cache.match(request);
    const fetchPromise = fetch(request).then(res => {
        cache.put(request, res.clone());
        return res;
    });

    return cached || fetchPromise;
}
