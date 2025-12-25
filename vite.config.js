import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    base: '/Obu-City-Transportation-Bureau-HomePage/',
    plugins: [react()],
    build: {
        outDir: 'docs',
        emptyOutDir: true
    }
})