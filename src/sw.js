import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

const CACHE_NAME = "oud-cache-initial"; // ビルド時に置換されるプレースホルダ
const BASE = self.registration.scope; // Pages対応

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(names => {

            // commitSHA形式のcache名を許可
            const isValidCache = /^oud-cache-[a-f0-9]+$/.test(CACHE_NAME);

            if (!isValidCache) {
                console.log('[SW] CACHE_NAME is unknown, keep existing caches');
                return;
            }

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
    // 既に存在する oud-cache があればそれを使う。
    const keys = await caches.keys();
    const existingCache = keys.find(k => k.startsWith('oud-cache'));

    // 存在するキャッシュがなければ、ビルド時に埋め込まれた CURRENT の CACHE_NAME
    // を使って新しいキャッシュを作成して保存する（プッシュ時刻を含めるため）。
    const targetCache = existingCache || CACHE_NAME;

    const cache = await caches.open(targetCache);
    const cached = await cache.match(request);
    if (cached) return cached;

    const fresh = await fetch(request);
    // 新しいキャッシュ名（ビルドで埋め込まれたCACHE_NAME）に保存
    await cache.put(request, fresh.clone());
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

