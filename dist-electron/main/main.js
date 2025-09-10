"use strict";
const electron = require("electron");
const path = require("node:path");
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 768,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js")
    }
  });
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}
electron.app.commandLine.appendSwitch("ignore-gpu-blocklist");
electron.app.commandLine.appendSwitch("enable-gpu-rasterization");
electron.app.commandLine.appendSwitch("enable-zero-copy");
electron.app.whenReady().then(() => {
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
