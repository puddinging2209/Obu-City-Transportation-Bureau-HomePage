import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

let cacheVersion

try {
    // public/oud が最後に変更されたコミットSHAを取得
    const lastOudCommit = execSync(
        'git log -n 1 --pretty=format:%H -- public/oud',
        { encoding: 'utf-8' }
    ).trim()

    cacheVersion = `oud-cache-${lastOudCommit}`
    console.log(`[update-cache-name] Last OUD change commit: ${lastOudCommit}`)
} catch (err) {
    console.log('[update-cache-name] Git error:', err.message)
    console.log('[update-cache-name] Fallback to timestamp')
    cacheVersion = `oud-cache-${Date.now()}`
}

// https://vitejs.dev/config/
export default defineConfig({
    base: '/Obu-City-Transportation-Bureau-HomePage/',
    build: {
        outDir: 'docs'
    },
    define: {
        __CACHE_VERSION__: JSON.stringify(cacheVersion)
    },
    plugins: [
        react(),
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.js',
            injectManifest: {
                injectionPoint: 'self.__WB_MANIFEST',
            },
            manifest: {
                name: 'Vite PWA App',
                short_name: 'PWA App',
                start_url: '/Obu-City-Transportation-Bureau-HomePage/',
                description: 'My Awesome Vite PWA App',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: 'favicon-96x96.png',
                        sizes: '96x96',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-192.png',
                        sizes: '192x192',
                        type: 'image/png'

                    },
                    {
                        src: 'pwa-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'pwa-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            devOptions: {
                enabled: true,
            }
        })
    ],
})
