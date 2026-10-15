// src/game/systems/Items/InventoryBagLayout.ts
//
// Pure geometry helpers for the Phaser backpack ("bolsa"). No Phaser and no
// `Item` runtime dependency, so the rules can be unit tested in Node.

export type BagCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right"

/** Canonical order of the corners used when spawning the bag. */
export const BAG_CORNERS: readonly BagCorner[] = ["top-left", "top-right", "bottom-left", "bottom-right"]

export interface Rect {
    x: number
    y: number
    width: number
    height: number
}

export interface Size {
    width: number
    height: number
}

export interface Point {
    x: number
    y: number
}

export interface SpawnResult {
    position: Point
    corner: BagCorner
}

export interface Page<T> {
    page: number
    pageCount: number
    offset: number
    items: T[]
}

function clamp(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return min
    return Math.max(min, Math.min(max, value))
}

export function rectCenter(rect: Rect): Point {
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
}

export function rectContains(rect: Rect, x: number, y: number): boolean {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

/**
 * Clamps a centre-based position so the whole box stays inside `region`.
 * When the box is larger than the region it is centred instead of clamped.
 */
export function clampToRegion(position: Point, region: Rect, size: Size): Point {
    const minX = region.x + size.width / 2
    const maxX = region.x + region.width - size.width / 2
    const minY = region.y + size.height / 2
    const maxY = region.y + region.height - size.height / 2

    return {
        x: maxX < minX ? rectCenter(region).x : clamp(position.x, minX, maxX),
        y: maxY < minY ? rectCenter(region).y : clamp(position.y, minY, maxY),
    }
}

/**
 * Picks one of the four corners of `region` and returns a centre-based position
 * for the box, jittered by up to `jitter` and kept fully inside the region.
 */
export function cornerSpawnPosition(region: Rect, size: Size, random: () => number, inset = 0, jitter = 0): SpawnResult {
    const index = clamp(Math.floor(random() * BAG_CORNERS.length), 0, BAG_CORNERS.length - 1)
    const corner = BAG_CORNERS[index]

    const minX = region.x + inset + size.width / 2
    const maxX = region.x + region.width - inset - size.width / 2
    const minY = region.y + inset + size.height / 2
    const maxY = region.y + region.height - inset - size.height / 2

    const baseX = corner.endsWith("left") ? minX : maxX
    const baseY = corner.startsWith("top") ? minY : maxY

    const position = clampToRegion(
        {
            x: baseX + (random() * 2 - 1) * jitter,
            y: baseY + (random() * 2 - 1) * jitter,
        },
        region,
        size
    )

    return { position, corner }
}

/**
 * Top-left position for the panel: placed on the side of the bag that keeps it
 * inside the viewport, vertically centred on the bag and clamped to the screen.
 */
export function panelPosition(bag: Point, bagSize: Size, viewport: Rect, panelSize: Size, gap: number, margin = 0): Point {
    const preferRight = bag.x <= viewport.x + viewport.width / 2
    const rightX = bag.x + bagSize.width / 2 + gap
    const leftX = bag.x - bagSize.width / 2 - gap - panelSize.width

    let x = preferRight ? rightX : leftX
    if (preferRight && x + panelSize.width > viewport.x + viewport.width) x = leftX
    if (!preferRight && x < viewport.x) x = rightX

    x = clamp(x, viewport.x + margin, viewport.x + viewport.width - panelSize.width - margin)
    const y = clamp(bag.y - panelSize.height / 2, viewport.y + margin, viewport.y + viewport.height - panelSize.height - margin)

    return { x, y }
}

/** Splits `items` into fixed-size pages, clamping the requested page. */
export function paginate<T>(items: readonly T[], page: number, perPage: number): Page<T> {
    const size = Math.max(1, Math.floor(perPage))
    const pageCount = Math.max(1, Math.ceil(items.length / size))
    const clampedPage = clamp(Math.trunc(page), 0, pageCount - 1)
    const offset = clampedPage * size

    return {
        page: clampedPage,
        pageCount,
        offset,
        items: items.slice(offset, offset + size),
    }
}

/** Row-major slot rects starting at the top-left `origin`. */
export function slotRects(origin: Point, columns: number, rows: number, slotSize: number, gap: number): Rect[] {
    const rects: Rect[] = []
    const safeColumns = Math.max(1, Math.floor(columns))
    const safeRows = Math.max(0, Math.floor(rows))

    for (let row = 0; row < safeRows; row++) {
        for (let column = 0; column < safeColumns; column++) {
            rects.push({
                x: origin.x + column * (slotSize + gap),
                y: origin.y + row * (slotSize + gap),
                width: slotSize,
                height: slotSize,
            })
        }
    }

    return rects
}
