import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import viteOgp from 'vite-plugin-open-graph';
import { VitePWA } from 'vite-plugin-pwa';

// public/oud の最終コミットSHA（またはタイムスタンプ）を取得する関数
function getOudCacheVersion() {
	try {
		const lastOudCommit = execSync('git log -n 1 --pretty=format:%H -- public/oud', {
			encoding: 'utf-8',
		}).trim();
		console.log(`[Cache Version] Last OUD change commit: ${lastOudCommit}`);
		return `oud-cache-${lastOudCommit}`;
	} catch (err) {
		console.log('[Cache Version] Git error:', err.message);
		console.log('[Cache Version] Fallback to timestamp');
		return `oud-cache-${Date.now()}`;
	}
}

const cacheVersion = getOudCacheVersion();

// https://vitejs.dev/config/
export default defineConfig({
	base: '/Obu-City-Transportation-Bureau-HomePage/',
	build: {
		outDir: 'docs',
	},
	define: {
		__OUD_CACHE_NAME__: JSON.stringify(cacheVersion),
	},
	plugins: [
		react(),
		VitePWA({
			strategies: 'injectManifest',
			srcDir: 'src',
			outDir: 'docs',
			filename: 'sw.js',
			injectRegister: 'inline',
			registerType: 'autoUpdate',
			injectManifest: {
				rollupFormat: 'iife',
				maximumFileSizeToCacheInBytes: 5000000,
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,txt}'],
				runtimeCaching: [
					{
						urlPattern: /\/Obu-City-Transportation-Bureau-HomePage\/oud\/.+\.json$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'oud-cache',
							expiration: {
								maxEntries: 50,
							},
						},
					},
					{
						urlPattern: /\/Obu-City-Transportation-Bureau-HomePage\/oud\/manifest\.json$/,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'oud-manifest',
							networkTimeoutSeconds: 3,
						},
					},
				],
			},
			manifest: {
				name: '大府市交通局',
				short_name: '大府市交通局',
				description: '架空鉄道「大府市営地下鉄」を含む大府市交通局のホームページです。',
				theme_color: '#f5f5f5',
				display: 'standalone',
				lang: 'ja-jp',
				start_url: '/Obu-City-Transportation-Bureau-HomePage/',
				icons: [
					{
						src: 'icons/192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'icons/512.png',
						sizes: '512x512',
						type: 'image/png',
					},
				],
			},
		}),
		viteOgp({
			basic: {
				title: '大府市交通局',
				type: 'website',
				image: 'https://puddinging2209.github.io/Obu-City-Transportation-Bureau-HomePage/icons/128.png',
				description: '架空鉄道「大府市営地下鉄」を含む大府市交通局のホームページです。',
				url: 'https://puddinging2209.github.io/Obu-City-Transportation-Bureau-HomePage/',
				locale: 'ja_JP',
			},
		}),
		{
			name: 'copy-manifest',
			writeBundle() {
				const srcManifest = 'public/oud/manifest.json';
				const destManifest = 'docs/oud/manifest.json';

				console.log('[copy-manifest] Checking for manifest.json...');

				if (!fs.existsSync(srcManifest)) {
					console.error(`❌ Source manifest not found: ${srcManifest}`);
					console.log('[copy-manifest] Available files in public/oud:');
					if (fs.existsSync('public/oud')) {
						const files = fs.readdirSync('public/oud');
						console.log(files);
					}
					return;
				}

				const destDir = path.dirname(destManifest);
				if (!fs.existsSync(destDir)) {
					fs.mkdirSync(destDir, { recursive: true });
					console.log(`[copy-manifest] Created directory: ${destDir}`);
				}

				fs.copyFileSync(srcManifest, destManifest);
				const stats = fs.statSync(destManifest);
				console.log(`✅ manifest.json copied to ${destManifest} (${stats.size} bytes)`);
			},
		},
	],
});
