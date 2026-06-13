import manifest from "virtual:asset-preview-manifest"
import type { PreviewAssetType } from "./previewRoute"

export interface PreviewAsset {
    type: PreviewAssetType
    name: string
    label: string
    path: string
}

export const previewAssetLabels: Record<PreviewAssetType, string> = {
    creature: "Creatures",
    portrait: "Portraits",
    fx: "FX",
}

const creatures: PreviewAsset[] = manifest.creatures.map((asset) => ({ ...asset, type: "creature" }))
const portraits: PreviewAsset[] = manifest.portraits.map((asset) => ({ ...asset, type: "portrait" }))
const fx: PreviewAsset[] = manifest.fx.map((asset) => ({ ...asset, type: "fx" }))

export const previewAssets: Record<PreviewAssetType, PreviewAsset[]> = {
    creature: creatures,
    portrait: portraits,
    fx,
}

export function findPreviewAsset(type: PreviewAssetType, name: string): PreviewAsset | undefined {
    return previewAssets[type].find((asset) => asset.name === name)
}

export function getFirstPreviewAsset(type: PreviewAssetType): PreviewAsset | undefined {
    return previewAssets[type][0]
}

export function getFirstAvailablePreviewAsset(): PreviewAsset | undefined {
    return getFirstPreviewAsset("creature") ?? getFirstPreviewAsset("portrait") ?? getFirstPreviewAsset("fx")
}
