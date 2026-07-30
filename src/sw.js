import { precacheAndRoute } from 'workbox-precaching';

// vite.config.js から注入される変数を受け取る
const CACHE_NAME = __OUD_CACHE_NAME__;

// VitePWAがビルド時にマニフェストを注入するプレースホルダー
const precacheManifest = self.__WB_MANIFEST;

// Viteが生成した全静的アセットを自動キャッシュ＆ルーティング
precacheAndRoute(precacheManifest);

self.addEventListener('install', () => {
	self.skipWaiting();
});

self.addEventListener('activate', (e) => {
	e.waitUntil(
		caches.keys().then((names) => {
			const isValidCache = /^(oud-cache-[a-f0-9])|(workbox-precache-.*)+$/.test(CACHE_NAME);

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
		if (response.ok) {
			// 配信された manifest.json を取得してキャッシュ中の manifest と比較し、差分があればクライアントに通知する
			try {
				const cloned = response.clone();
				const manifestJson = await cloned.json();

				const cache = await caches.open(CACHE_NAME);
				// キャッシュ内の manifest を可能なパスで探す（絶対URL / 相対パス）
				let cachedResp =
					(await cache.match(request)) ||
					(await cache.match('/oud/manifest.json')) ||
					(await cache.match('/Obu-City-Transportation-Bureau-HomePage/oud/manifest.json'));
				let cachedJson = null;
				if (cachedResp) {
					try {
						cachedJson = await cachedResp.json();
					} catch (e) {
						cachedJson = null;
					}
				}

				const changed = JSON.stringify(manifestJson) !== JSON.stringify(cachedJson);
				if (changed) {
					// すべてのクライアントに通知
					const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
					for (const c of clientsList) {
						c.postMessage({ type: 'OUD_MANIFEST_UPDATED', manifest: manifestJson });
					}
				}
			} catch (e) {
				console.warn('[SW] manifest comparison failed', e);
			}

			return response;
		}
	} catch (err) {
		console.log('[SW] Failed to fetch manifest.json from network');
	}

	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request);
	return cached || new Response('Not found', { status: 404 });
}

/* クライアントからのメッセージで OUD キャッシュを更新する */
async function updateOudCache(manifest) {
	if (!manifest || !manifest.files) return { success: false, reason: 'invalid_manifest' };

	try {
		const cache = await caches.open(CACHE_NAME);

		const fileEntries = Object.entries(manifest.files);
		for (const [name, meta] of fileEntries) {
			const url = `/Obu-City-Transportation-Bureau-HomePage/oud/${name}?h=${meta.hash}`;
			try {
				const res = await fetch(url, { cache: 'no-store' });
				if (res && res.ok) {
					await cache.put(`/Obu-City-Transportation-Bureau-HomePage/oud/${name}`, res.clone());
				}
			} catch (e) {
				console.warn('[SW] Failed to fetch oud file', name, e);
			}
		}

		// manifest 自体もキャッシュしておく (フルパス)
		await cache.put(
			'/Obu-City-Transportation-Bureau-HomePage/oud/manifest.json',
			new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/json' } }),
		);

		return { success: true };
	} catch (e) {
		console.error('[SW] updateOudCache failed', e);
		return { success: false, reason: e.message };
	}
}

async function cacheFirst(request) {
	const keys = await caches.keys();
	const existingCache = keys.find((k) => k.startsWith('oud-cache'));
	const targetCache = existingCache || CACHE_NAME;

	const cache = await caches.open(targetCache);
	const cached = await cache.match(request);
	if (cached) return cached;

	try {
		let response = await fetch(request);
		// レスポンスが正常（200 OK等）かつ基本型の場合のみキャッシュする
		if (response && response.status === 200) {
			await cache.put(request, response.clone());
		}
		return response;
	} catch (err) {
		console.error('[SW] Fetch failed:', err);
	}
}

/* クライアントからのメッセージを受け取ってキャッシュをクリア */
self.addEventListener('message', (event) => {
	if (!event.data || !event.data.type) return;

	if (event.data.type === 'CLEAR_CACHE') {
		caches.delete(CACHE_NAME).then(() => {
			console.log('[SW] Cache cleared by client');
			if (event.ports && event.ports[0]) event.ports[0].postMessage({ success: true });
			else if (event.source) event.source.postMessage({ type: 'CLEAR_CACHE_RESULT', success: true });
		});
		return;
	}

	if (event.data.type === 'UPDATE_OUD_CACHE') {
		(async () => {
			const manifest = event.data.manifest || null;
			const result = await updateOudCache(manifest);
			if (event.ports && event.ports[0]) event.ports[0].postMessage(result);
			else if (event.source) event.source.postMessage({ type: 'UPDATE_OUD_CACHE_RESULT', ...result });
		})();
		return;
	}

	if (event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
		return;
	}
});
