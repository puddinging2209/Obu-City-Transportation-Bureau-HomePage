import { precacheAndRoute } from 'workbox-precaching';

// vite.config.js から注入される変数を受け取る
const CACHE_NAME = __OUD_CACHE_NAME__;

// VitePWAがビルド時にマニフェストを注入するプレースホルダー
const precacheManifest = self.__WB_MANIFEST;

// Viteが生成した全静的アセットを自動キャッシュ＆ルーティング
precacheAndRoute(precacheManifest);

// 1. Install - キャッシュ領域を事前に準備
self.addEventListener('install', (e) => {
	e.waitUntil(
		caches.open(CACHE_NAME).then(() => {
			console.log(`[SW] Initialized cache: ${CACHE_NAME}`);
		}),
	);
	self.skipWaiting();
});

// 2. Activate - 古い oud-cache-xxx を削除
self.addEventListener('activate', (e) => {
	e.waitUntil(
		caches.keys().then((names) => {
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

// 3. Fetch イベントハンドラ
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// /oud/ 以外のリクエストは Workbox のプリキャッシュに任せる
	if (!url.pathname.includes('/oud/')) return;

	// manifest.json は Network First（常に最新を取得・失敗したらキャッシュ）
	if (url.pathname.endsWith('/oud/manifest.json')) {
		event.respondWith(networkFirst(event.request));
		return;
	}

	// 各路線 JSON は Cache First（キャッシュになければネットワークから取得して自動保存）
	event.respondWith(cacheFirst(event.request));
});

/* manifest.json 用：Network First */
async function networkFirst(request) {
	const cache = await caches.open(CACHE_NAME);
	try {
		const response = await fetch(request);
		if (response && response.ok) {
			// 取得成功したら自動的に CacheStorage へ保存
			await cache.put(request, response.clone());
			return response;
		}
	} catch (err) {
		console.log('[SW] Failed to fetch manifest.json from network, falling back to cache');
	}

	// オフライン時はキャッシュから返す
	const cached = await cache.match(request);
	return cached || new Response('Not found', { status: 404 });
}

/* OUD JSON データ用：Cache First */
async function cacheFirst(request) {
	const cache = await caches.open(CACHE_NAME);

	// 1. まずキャッシュを検索 (クエリ ?h=xxx を含むURLで一致)
	const cached = await cache.match(request);
	if (cached) return cached;

	// 2. キャッシュに無ければネットワークから取得して自動で CacheStorage に入れる
	try {
		const response = await fetch(request);
		if (response && response.status === 200) {
			await cache.put(request, response.clone());
		}
		return response;
	} catch (err) {
		console.error('[SW] Fetch failed for OUD JSON:', err);
	}
}

// 4. Message イベントハンドラ
self.addEventListener('message', (event) => {
	if (!event.data || !event.data.type) return;

	if (event.data.type === 'CLEAR_CACHE') {
		caches.delete(CACHE_NAME).then(() => {
			console.log('[SW] Cache cleared by client');
			if (event.ports && event.ports[0]) event.ports[0].postMessage({ success: true });
		});
		return;
	}

	if (event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
		return;
	}
});
