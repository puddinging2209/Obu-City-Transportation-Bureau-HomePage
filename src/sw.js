import { precacheAndRoute } from 'workbox-precaching';

// 1. Viteがビルドしたアセット（HTML/JS/CSS等）の自動プリキャッシュを登録
precacheAndRoute(self.__WB_MANIFEST);

// 2. vite.config.js から注入される変数を受け取る
const CACHE_NAME = __OUD_CACHE_NAME__;

const BASE = self.registration.scope;

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((names) => {
            const isValidCache = /^oud-cache-[a-f0-9]+$/.test(CACHE_NAME);

            if (!isValidCache) {
                console.log('[SW] CACHE_NAME is unknown, keep existing caches');
                return;
            }

            return Promise.all(
                names
                    .filter((name) => name.startsWith('oud-cache') && name !== CACHE_NAME)
                    .map((name) => {
                        console.log(`[SW] Deleting old cache: ${name}`);
                        return caches.delete(name);
                    }),
            );
        }),
    );

    e.waitUntil(self.clients.claim());
});

/* OUD JSONのみキャッシュ - manifest.jsonは除外 */
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 既存の /oud/ 以外のリクエストはWorkboxのプリキャッシュ処理に任せる
    if (!url.pathname.includes('/oud/')) return;

    if (url.pathname.endsWith('/oud/manifest.json')) {
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
        console.log('[SW] Failed to fetch manifest.json from network');
    }

    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    return cached || new Response('Not found', { status: 404 });
}

async function cacheFirst(request) {
    const keys = await caches.keys();
    const existingCache = keys.find((k) => k.startsWith('oud-cache'));
    const targetCache = existingCache || CACHE_NAME;

    const cache = await caches.open(targetCache);
    const cached = await cache.match(request);
    if (cached) return cached;

    const fresh = await fetch(request);
    await cache.put(request, fresh.clone());
    return fresh;
}

/* クライアントからのメッセージを受け取ってキャッシュをクリア */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[SW] Cache cleared by client');
            event.ports.postMessage({ success: true });
        });
    }
});
