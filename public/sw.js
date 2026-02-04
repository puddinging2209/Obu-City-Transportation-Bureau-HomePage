const CACHE_NAME = "oud-cache-v2";
const BASE = self.registration.scope; // Pages対応

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    e.waitUntil(self.clients.claim());
});

/* OUD JSONのみキャッシュ - manifest.jsonは除外 */
self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    if (!url.pathname.includes("/oud/")) return;

    // manifest.json はキャッシュしない（ネットワークのみ）
    if (url.pathname.endsWith("/oud/manifest.json")) {
        event.respondWith(fetch(event.request));
        return;
    }

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

/* クライアントからのメッセージを受け取ってキャッシュをクリア */
self.addEventListener("message", event => {
    if (event.data && event.data.type === "CLEAR_CACHE") {
        caches.delete(CACHE_NAME).then(() => {
            console.log("[SW] Cache cleared by client");
            event.ports[0].postMessage({ success: true });
        });
    }
});

