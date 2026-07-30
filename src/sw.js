import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

const CACHE_NAME = __OUD_CACHE_NAME__;
const precacheManifest = self.__WB_MANIFEST;

precacheAndRoute(precacheManifest);

self.addEventListener('install', () => self.skipWaiting());

// 古いキャッシュグループ（旧 CACHE_NAME）の丸ごと削除
self.addEventListener('activate', (e) => {
	e.waitUntil(
		caches.keys().then((names) => {
			return Promise.all(
				names
					.filter((name) => name.startsWith('oud-cache') && name !== CACHE_NAME)
					.map((name) => {
						console.log(`[SW] 不要な古いキャッシュグループを削除: ${name}`);
						return caches.delete(name);
					}),
			);
		}),
	);
	e.waitUntil(self.clients.claim());
});

// 💡 旧ハッシュ付きファイル & クエリなしの旧ファイルを自動削除するカスタムプラグイン
const cleanOldHashPlugin = {
	cacheDidUpdate: async ({ cacheName, request }) => {
		const cache = await caches.open(cacheName);
		const keys = await cache.keys();
		const currentUrl = new URL(request.url);

		for (const req of keys) {
			const reqUrl = new URL(req.url);

			// パスが一致し、完全なURL(クエリ含)が異なるものを消去
			if (reqUrl.pathname === currentUrl.pathname && reqUrl.href !== currentUrl.href) {
				console.log(`[SW] 古いキャッシュ（旧ハッシュ）を削除: ${reqUrl.href}`);
				await cache.delete(req);
			}
		}
	},
};

// A) manifest.json -> NetworkFirst (ブラウザの disk cache をバイパス)
registerRoute(
	({ url }) => url.pathname.includes('/oud/') && url.pathname.endsWith('manifest.json'),
	new NetworkFirst({
		cacheName: CACHE_NAME,
		networkTimeoutSeconds: 3,
		fetchOptions: {
			cache: 'no-cache', // ブラウザの HTTP ディスクキャッシュを強制無視する
		},
		plugins: [
			new CacheableResponsePlugin({
				statuses: [0, 200],
			}),
		],
	}),
);

// B) 各路線 JSON (*.json) -> NetworkFirst + 旧ファイル自動消去
registerRoute(
	({ url }) => url.pathname.includes('/oud/') && !url.pathname.endsWith('manifest.json'),
	new NetworkFirst({
		cacheName: CACHE_NAME,
		networkTimeoutSeconds: 3,
		fetchOptions: {
			cache: 'no-cache', // ブラウザの HTTP ディスクキャッシュを強制無視する
		},
		plugins: [
			new CacheableResponsePlugin({
				statuses: [0, 200],
			}),
			cleanOldHashPlugin,
		],
	}),
);

// 4. Message イベントハンドラ（キャッシュクリア・スキップ用）
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
