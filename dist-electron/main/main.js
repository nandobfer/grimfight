"use strict";
const electron = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const node_url = require("node:url");
const setupAssetRewrite = () => {
  const distDir = path.join(electron.app.getAppPath(), "dist");
  const assetsDir = path.join(distDir, "assets");
  electron.session.defaultSession.webRequest.onBeforeRequest({ urls: ["file://*/*"] }, (details, cb) => {
    try {
      const url = new URL(details.url);
      if (url.pathname.startsWith("/assets/")) {
        const rel = url.pathname.slice("/assets/".length);
        const filePath = path.join(assetsDir, rel);
        if (fs.existsSync(filePath)) {
          cb({ redirectURL: node_url.pathToFileURL(filePath).toString() });
          return;
        }
      }
    } catch {
    }
    cb({});
  });
};
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 768,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      webgl: true
    },
    darkTheme: true,
    fullscreen: true,
    title: "Grim Fight"
  });
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}
electron.app.commandLine.appendSwitch("ignore-gpu-blocklist");
electron.app.commandLine.appendSwitch("enable-gpu-rasterization");
electron.app.commandLine.appendSwitch("enable-zero-copy");
electron.app.whenReady().then(() => {
  const usingFileProtocol = !process.env.ELECTRON_RENDERER_URL;
  if (usingFileProtocol) setupAssetRewrite();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
electron.app.whenReady().then(() => {
  console.log("GPU:", electron.app.getGPUFeatureStatus());
});
//# sourceMappingURL=main.js.map
