import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { assetPreviewManifest } from './assetPreviewManifest.mjs'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        assetPreviewManifest(),
    ],
    server: {
        port: 8080
    }
})
