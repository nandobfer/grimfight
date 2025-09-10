import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        build: {
            lib: { entry: path.join(__dirname, "electron/main.ts") },
            outDir: "dist-electron/main",
            sourcemap: true,
        },
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            rollupOptions: {
                input: { preload: path.join(__dirname, "electron/preload.ts") },
            },
            outDir: "dist-electron/preload",
            sourcemap: true,
        },
    },
    renderer: {
        root: __dirname,
        base: "./",
        publicDir: path.join(__dirname, "public"),
        plugins: [react()],
        build: {
            // 👇 Tell electron-vite where your renderer HTML lives
            rollupOptions: {
                input: path.join(__dirname, "index.html"),
            },
            // optional but keeps things tidy
            outDir: "dist",
        },
        server: {
            port: 8080,
        },
    },
})
