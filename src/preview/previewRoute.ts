export const previewAssetTypes = ["creature", "portrait", "fx"] as const

export type PreviewAssetType = (typeof previewAssetTypes)[number]

export interface PreviewRouteSelection {
    type: PreviewAssetType
    name: string
}

export function isPreviewAssetType(value: string): value is PreviewAssetType {
    return previewAssetTypes.includes(value as PreviewAssetType)
}

export function isPreviewRoute(pathname: string): boolean {
    return pathname.split("/").filter(Boolean)[0] === "preview"
}

export function parsePreviewRoute(pathname: string): PreviewRouteSelection | undefined {
    const segments = pathname.split("/").filter(Boolean).map((segment) => decodeURIComponent(segment))
    if (segments[0] !== "preview") return undefined

    const compactParam = segments[1]
    if (!compactParam) return undefined

    if (isPreviewAssetType(compactParam) && segments[2]) {
        return { type: compactParam, name: segments[2] }
    }

    const separatorIndex = compactParam.indexOf("-")
    if (separatorIndex <= 0) return undefined

    const type = compactParam.slice(0, separatorIndex)
    const name = compactParam.slice(separatorIndex + 1)
    if (!isPreviewAssetType(type) || !name) return undefined


    return { type, name }
}

export function buildPreviewRoute(selection: PreviewRouteSelection): string {
    return `/preview/${selection.type}-${encodeURIComponent(selection.name)}`
}
