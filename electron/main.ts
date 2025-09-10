import { app, BrowserWindow } from "electron"
import path from "node:path"

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, "../preload/preload.js"),
        },
    })

    // Dev vs Prod
    const devUrl = process.env.ELECTRON_RENDERER_URL
    if (devUrl) {
        win.loadURL(devUrl)
        win.webContents.openDevTools({ mode: "detach" })
    } else {
        // dist-electron/main/main.js  -> __dirname is dist-electron/main
        // renderer outDir is "dist"   -> ../../dist/index.html
        win.loadFile(path.join(__dirname, "../../dist/index.html"))
    }
}

app.whenReady().then(() => {
    createWindow()

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})
