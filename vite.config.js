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