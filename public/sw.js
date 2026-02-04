const CACHE_NAME = "oud-cache-v3";
const BASE = self.registration.scope; // Pages対応

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(names => {
            // 既に同名のキャッシュが存在する（つまりCACHE_NAMEが既存）なら削除をスキップ
            if (names.includes(CACHE_NAME)) {
                console.log('[SW] Current cache exists, skip deleting caches');
                return;
            }

            // "oud-cache" で始まり、現在の CACHE_NAME と異なるキャッシュを削除
            return Promise.all(
                names
                    .filter(name => name.startsWith("oud-cache") && name !== CACHE_NAME)
                    .map(name => {
                        console.log(`[SW] Deleting old cache: ${name}`);
                        return caches.delete(name);
                    })
            );
        })
    );
    e.waitUntil(self.clients.claim());
});

/* OUD JSONのみキャッシュ - manifest.jsonは除外 */
self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    if (!url.pathname.includes("/oud/")) return;

    // manifest.json はキャッシュしない（ネットワークのみ、エラー時はキャッシュ）
    if (url.pathname.endsWith("/oud/manifest.json")) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    event.respondWith(cacheFirst(event.request));
});

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) return response;
    } catch (err) {
        console.log("[SW] Failed to fetch manifest.json from network");
    }

    // ネットワーク失敗時はキャッシュから返す
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    return cached || new Response("Not found", { status: 404 });
}

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

