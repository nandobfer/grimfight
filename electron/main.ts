import { app, BrowserWindow } from "electron"
import path from "node:path"
import { setupAssetRewrite } from "./assetRewrite"

function createWindow() {
    const win = new BrowserWindow({
        width: 768,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, "../preload/preload.js"),
            webgl: true,
        },
        darkTheme: true,
        fullscreen: true,
        title: "Grim Fight",
    })

    // Dev vs Prod
    const devUrl = process.env.ELECTRON_RENDERER_URL
    if (devUrl) {
        win.loadURL(devUrl)
        // win.webContents.openDevTools({ mode: "detach" })
    } else {
        // file:// protocol (preview or packaged)
        win.loadFile(path.join(__dirname, "../../dist/index.html"))
    }
}

app.commandLine.appendSwitch("ignore-gpu-blocklist")
app.commandLine.appendSwitch("enable-gpu-rasterization")
app.commandLine.appendSwitch("enable-zero-copy")

app.whenReady().then(() => {
    const usingFileProtocol = !process.env.ELECTRON_RENDERER_URL
    if (usingFileProtocol) setupAssetRewrite()

    createWindow()

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})

app.whenReady().then(() => {
    console.log("GPU:", app.getGPUFeatureStatus())
})
