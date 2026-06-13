/// <reference types="vite/client" />

declare module "virtual:asset-preview-manifest" {
    export interface PreviewAssetManifestItem {
        name: string
        label: string
        path: string
    }

    export interface PreviewAssetManifest {
        creatures: PreviewAssetManifestItem[]
        portraits: PreviewAssetManifestItem[]
        fx: PreviewAssetManifestItem[]
    }

    const manifest: PreviewAssetManifest
    export default manifest
}
