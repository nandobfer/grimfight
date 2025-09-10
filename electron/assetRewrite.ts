// electron/assetRewrite.ts
import { app, session } from "electron"
import path from "node:path"
import fs from "node:fs"
import { pathToFileURL } from "node:url"

export const setupAssetRewrite = () => {
    // We want this in *preview* (file:// + unpackaged) and *packaged*
    // Only skip when the renderer is served via HTTP dev server.
    // (That condition is handled in main.ts; we don't early-return here.)

    // Where the renderer build lives:
    // - preview: <project>/dist
    // - packaged: <resources>/app/dist  (app.getAppPath() points to resources/app or app.asar)
    const distDir = path.join(app.getAppPath(), "dist")
    const assetsDir = path.join(distDir, "assets")

    session.defaultSession.webRequest.onBeforeRequest({ urls: ["file://*/*"] }, (details, cb) => {
        try {
            const url = new URL(details.url)
            // Requests like file:///assets/foo.png → pathname === "/assets/foo.png"
            if (url.pathname.startsWith("/assets/")) {
                const rel = url.pathname.slice("/assets/".length)
                const filePath = path.join(assetsDir, rel)
                if (fs.existsSync(filePath)) {
                    // Use pathToFileURL to avoid backslash issues on Windows
                    cb({ redirectURL: pathToFileURL(filePath).toString() })
                    return
                }
            }
        } catch {
            // fall through
        }
        cb({}) // no change
    })
}
