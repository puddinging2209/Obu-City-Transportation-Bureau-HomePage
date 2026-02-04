import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
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
                // public/oud/ 配下のファイルが変更されたかチェック
                let hasOudChanges = false

                try {
                    // git diff で変更されたファイルを取得
                    const diff = execSync('git diff --name-only HEAD', { encoding: 'utf-8' })
                    const changedFiles = diff.split('\n').filter(f => f)

                    // public/oud/ 配下に変更があるか確認
                    hasOudChanges = changedFiles.some(f => f.startsWith('public/oud/'))

                    if (hasOudChanges) {
                        console.log('[update-cache-name] Changes detected in public/oud/')
                    } else {
                        console.log('[update-cache-name] No changes in public/oud/ - keeping existing cache')
                    }
                } catch (err) {
                    console.log('[update-cache-name] Git not available, assuming changes were made')
                    hasOudChanges = true
                }

                // public/oud/ 配下に変更がある場合のみ CACHE_NAME を更新
                let cacheVersion = 'oud-cache-v3' // デフォルト

                if (hasOudChanges) {
                    cacheVersion = `oud-cache-${Date.now()}`
                    console.log(`[update-cache-name] Cache name updated: ${cacheVersion}`)
                } else {
                    console.log(`[update-cache-name] Cache name kept: ${cacheVersion}`)
                }

                // sw.js を読み込み、CACHE_NAME を置換
                const swPath = 'public/sw.js'
                const swContent = fs.readFileSync(swPath, 'utf-8')
                const updatedSw = swContent.replace(
                    /const CACHE_NAME = "oud-cache-[^"]*";/,
                    `const CACHE_NAME = "${cacheVersion}";`
                )

                // docs/sw.js に出力
                const docsSwPath = 'docs/sw.js'
                if (!fs.existsSync('docs')) {
                    fs.mkdirSync('docs', { recursive: true })
                }
                fs.writeFileSync(docsSwPath, updatedSw)
                console.log(`[update-cache-name] Updated sw.js`)
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