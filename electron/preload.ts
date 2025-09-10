import { contextBridge } from 'electron'
// Expose minimal API if you want
contextBridge.exposeInMainWorld('versions', { node: process.versions.node })
