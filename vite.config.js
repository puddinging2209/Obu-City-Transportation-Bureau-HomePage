import react from '@vitejs/plugin-react'
import fs from 'fs'
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
                    fs.copyFileSync(srcManifest, destManifest)
                    console.log('✅ manifest.json copied to docs/oud/')
                }
            }
        }
    ],
})