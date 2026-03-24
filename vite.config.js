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
    plugins: [
        react(),
        VitePWA({
            strategy: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.js',
            injectManifest: {
                inlineWorkboxRuntime: true,
                injectionPoint: 'self.__WB_MANIFEST',
                injectionReplacement: [
                    { search: 'oud-cache-initial', replace: cacheVersion }
                ],
                swDest: 'sw.js'
            },
            base: '/Obu-City-Transportation-Bureau-HomePage/',
            includeAssets: [
                'icons/favicon.ico',
                'icons/apple-touch-icon.png',
                'icons/favicon.svg'
            ],
            manifest: {
                name: 'Vite PWA App',
                short_name: 'PWA App',
                start_url: '/Obu-City-Transportation-Bureau-HomePage/',
                description: 'My Awesome Vite PWA App',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: '/Obu-City-Transportation-Bureau-HomePage/favicon-96x96.png',
                        sizes: '96x96',
                    },
                    {
                        src: '/Obu-City-Transportation-Bureau-HomePage/pwa-192.png',
                        sizes: '192x192',
                    },
                    {
                        src: '/Obu-City-Transportation-Bureau-HomePage/pwa-512.png',
                        sizes: '512x512',
                        purpose: 'any'
                    },
                    {
                        src: '/Obu-City-Transportation-Bureau-HomePage/pwa-512.png',
                        sizes: '512x512',
                        purpose: 'maskable'
                    }
                ]
            },
            devOptions: {
                enabled: true,
                type: 'module'
            }
        })
    ],
})
