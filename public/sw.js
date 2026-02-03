const CACHE_NAME = "oud-cache-v1";
const BASE = self.registration.scope; // Pages対応
let lastManifestHash = null;

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    e.waitUntil(self.clients.claim());
});

/* manifest.jsonをネットワークファースト戦略で取得してキャッシュを更新 */
self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    // manifest.jsonはネットワークファースト（常に最新を確認）
    if (url.pathname.endsWith("/oud/manifest.json")) {
        event.respondWith(checkAndUpdateCache(event.request));
        return;
    }

    // OUD JSONはキャッシュファースト
    if (!url.pathname.includes("/oud/")) return;

    event.respondWith(cacheFirst(event.request));
});

/* manifest.json をネットワークから取得し、ハッシュが変わったらキャッシュをクリア */
async function checkAndUpdateCache(request) {
    try {
        const fresh = await fetch(request);
        const freshText = await fresh.clone().text();
        const freshHash = hashString(freshText);

        // ハッシュが変わった場合はキャッシュをクリア
        if (lastManifestHash !== null && lastManifestHash !== freshHash) {
            console.log("[SW] Manifest updated - clearing cache");
            await caches.delete(CACHE_NAME);
        }

        lastManifestHash = freshHash;

        // キャッシュに保存しない（毎回ネットワークから取得）
        return fresh;
    } catch (err) {
        console.log("[SW] Failed to fetch manifest, using cache or offline response");
        const cache = await caches.open(CACHE_NAME);
        return cache.match(request) || new Response("Offline", { status: 503 });
    }
}

/* 文字列のハッシュを生成（簡易版） */
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
}

async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);

    const cached = await cache.match(request);
    if (cached) return cached;

    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
}
