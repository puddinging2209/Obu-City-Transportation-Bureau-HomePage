import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    build: {
        outDir: 'docs'
    },
    plugins: [
        react(),
        {
            name: 'update-cache-name',
            async generateBundle() {
                // ビルド時刻をUNIXタイムスタンプで生成
                const cacheVersion = `oud-cache-${Date.now()}`
                console.log(`[update-cache-name] Cache name: ${cacheVersion}`)

                // sw.js を読み込み、CACHE_NAME を置換
                const swPath = 'public/sw.js'
                const swContent = fs.readFileSync(swPath, 'utf-8')
                const updatedSw = swContent.replace(
                    /const CACHE_NAME = "oud-cache-v\d+";/,
                    `const CACHE_NAME = "${cacheVersion}";`
                )

                // docs/sw.js に出力
                const docsSwPath = 'docs/sw.js'
                if (!fs.existsSync('docs')) {
                    fs.mkdirSync('docs', { recursive: true })
                }
                fs.writeFileSync(docsSwPath, updatedSw)
                console.log(`[update-cache-name] Updated sw.js with new cache name`)
            }
        },
        {
            name: 'copy-manifest',
            writeBundle() {
                // ビルド後、manifest.jsonをdocs/oudにコピー
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

                // ディレクトリが存在しない場合は作成
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
    ],
})