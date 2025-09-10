"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("versions", { node: process.versions.node });
//# sourceMappingURL=preload.js.map
