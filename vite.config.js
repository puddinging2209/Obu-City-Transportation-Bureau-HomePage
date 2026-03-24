import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/Obu-City-Transportation-Bureau-HomePage/',
    build: {
        outDir: 'docs'
    },
    plugins: [
        react(),
        {
            name: 'update-cache-name',
            async generateBundle() {

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

                // sw.js を読み込み、CACHE_NAME を置換
                const swPath = 'public/sw.js'
                const swContent = fs.readFileSync(swPath, 'utf-8')

                const updatedSw = swContent.replace(
                    /const CACHE_NAME = "oud-cache-[^"]*";/,
                    `const CACHE_NAME = "${cacheVersion}";`
                )

                const docsSwPath = 'docs/sw.js'

                if (!fs.existsSync('docs')) {
                    fs.mkdirSync('docs', { recursive: true })
                }

                fs.writeFileSync(docsSwPath, updatedSw)
                console.log('[update-cache-name] Updated sw.js')
            }
        },
        {
            name: 'copy-manifest',
            writeBundle() {
                const srcManifest = 'public/oud/manifest.json'
                const destManifest = 'docs/oud/manifest.json'

                console.log('[copy-manifest] Checking for manifest.json...')

                if (!fs.existsSync(srcManifest)) {
                    console.error(`❌ Source manifest not found: ${srcManifest}`)
                    console.log('[copy-manifest] Available files in public/oud:')
                    if (fs.existsSync('public/oud')) {
                        const files = fs.readdirSync('public/oud')
                        console.log(files)
                    }
                    return
                }

                const destDir = path.dirname(destManifest)
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true })
                    console.log(`[copy-manifest] Created directory: ${destDir}`)
                }

                fs.copyFileSync(srcManifest, destManifest)
                const stats = fs.statSync(destManifest)
                console.log(`✅ manifest.json copied to ${destManifest} (${stats.size} bytes)`)
            }
        }
    ]
})
