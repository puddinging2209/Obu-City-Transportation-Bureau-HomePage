const CACHE_NAME = "oud-cache";
const MANIFEST_URL = "/oud/manifest.json";

self.addEventListener("install", e => {
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    if (url.pathname.includes("oud/")) {
        event.respondWith(cacheThenUpdate(event.request));
    }
});

async function cacheThenUpdate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
}

// 更新チェック
self.addEventListener("message", async e => {
    if (e.data !== "CHECK_UPDATE") return;

    const res = await fetch(MANIFEST_URL);
    const manifest = await res.json();
    const cache = await caches.open(CACHE_NAME);

    for (const [file, info] of Object.entries(manifest.files)) {
        const url = `./oud/${file}`;
        const cached = await cache.match(url);

        if (!cached) {
            const res = await fetch(url);
            cache.put(url, res.clone());
            continue;
        }

        const buf = await cached.arrayBuffer();
        const hash = await sha256(buf);

        if (hash !== info.hash) {
            const res = await fetch(url);
            cache.put(url, res.clone());
        }
    }
});

async function sha256(buf) {
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return [...new Uint8Array(hash)]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}
