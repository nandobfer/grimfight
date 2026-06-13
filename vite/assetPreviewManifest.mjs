import fs from "node:fs"
import path from "node:path"

const virtualModuleId = "virtual:asset-preview-manifest"
const resolvedVirtualModuleId = `\0${virtualModuleId}`

const assetRoots = {
    creatures: "public/assets/spritesheets/characters",
    portraits: "public/assets/portraits",
    fx: "public/assets/particles",
}

const extensions = {
    creatures: new Set([".svg"]),
    portraits: new Set([".webp", ".png", ".jpg", ".jpeg", ".svg"]),
    fx: new Set([".svg"]),
}

function toAssetUrl(filePath) {
    const relativePath = path.relative(path.resolve(process.cwd(), "public"), filePath).replaceAll(path.sep, "/")
    return `/${relativePath}`
}

function collectAssets(kind) {
    const root = path.resolve(process.cwd(), assetRoots[kind])
    if (!fs.existsSync(root)) return []

    return fs
        .readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => {
            const extension = path.extname(entry.name).toLowerCase()
            if (!extensions[kind].has(extension)) return undefined

            const name = path.basename(entry.name, path.extname(entry.name))
            return {
                name,
                label: name,
                path: toAssetUrl(path.join(root, entry.name)),
            }
        })
        .filter(Boolean)
        .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }))
}

export function assetPreviewManifest() {
    return {
        name: "asset-preview-manifest",
        resolveId(id) {
            if (id === virtualModuleId) return resolvedVirtualModuleId
            return undefined
        },
        load(id) {
            if (id !== resolvedVirtualModuleId) return undefined

            const manifest = {
                creatures: collectAssets("creatures"),
                portraits: collectAssets("portraits"),
                fx: collectAssets("fx"),
            }

            return `export default ${JSON.stringify(manifest, null, 2)}`
        },
    }
}
