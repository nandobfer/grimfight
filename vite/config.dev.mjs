import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { assetPreviewManifest } from './assetPreviewManifest.mjs'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    define: {
        __ASSET_VERSION__: JSON.stringify(`${Date.now().toString(36)}`),
    },
    plugins: [
        react(),
        assetPreviewManifest(),
    ],
    server: {
        port: 8080
    }
})
