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

                if (fs.existsSync(srcManifest)) {
                    // ディレクトリが存在しない場合は作成
                    const destDir = path.dirname(destManifest)
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true })
                    }

                    fs.copyFileSync(srcManifest, destManifest)
                    console.log('✅ manifest.json copied to docs/oud/')
                } else {
                    console.warn('⚠️ manifest.json not found in public/oud/')
                }
            }
        }
    ],
})