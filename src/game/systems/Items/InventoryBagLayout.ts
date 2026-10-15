// src/game/systems/Items/InventoryBagLayout.ts
//
// Pure geometry for the Phaser backpack ("bolsa"): where the bag icon is
// anchored, how the item grid grows with the content and how the scrollable
// window is measured. No Phaser and no `Item` runtime dependency, so the rules
// can be unit tested in Node.

import { INVENTORY_CATEGORIES, InventoryCategory } from "./ItemInventoryLayout"

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

/** Sizes that describe one backpack grid. */
export interface GridMetrics {
    /** Side of a single item slot. */
    slotSize: number
    /** Space between two neighbouring slots. */
    gap: number
    /** Height of the labelled divider drawn between two categories. */
    dividerHeight: number
    /** Hard cap on how wide the grid is allowed to grow. */
    maxColumns: number
    /** Hard cap on how many rows are visible before the grid scrolls. */
    maxRows: number
}

/** A category occupies a contiguous block of rows, so dividers never cut a row. */
export interface CategoryRun {
    category: InventoryCategory
    startRow: number
    rows: number
    count: number
}

export interface BagContentLayout {
    /** Columns the grid currently uses (grows with the content, capped by `maxColumns`). */
    columns: number
    /** Rows needed by every category together. */
    rows: number
    /** Rows visible at once (capped by `maxRows`). */
    visibleRows: number
    runs: CategoryRun[]
    /** Content-local y of every grid row. */
    rowTops: number[]
    /** Content-local y of every category divider strip. */
    dividerTops: number[]
    /** Full height of the content, including dividers. */
    contentHeight: number
    /** Height of the visible window. */
    viewportHeight: number
    /** Pixels the content can be scrolled. Zero when everything fits. */
    scrollRange: number
    gridWidth: number
}

export interface ScrollbarGeometry {
    track: Rect
    thumb: Rect
    /** Distance the thumb can travel inside the track. */
    thumbTravel: number
}

/** Smallest allowed scrollbar thumb, so a long list stays draggable. */
export const MIN_SCROLLBAR_THUMB = 24

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
 * Centre-based position for a box anchored to the top-right corner of `region`,
 * which is where the backpack always lives. `margin` keeps it off the border.
 */
export function topRightAnchor(region: Rect, size: Size, margin = 0): Point {
    return clampToRegion(
        {
            x: region.x + region.width - margin - size.width / 2,
            y: region.y + margin + size.height / 2,
        },
        region,
        size
    )
}

/**
 * Top-left position for the panel: hanging below the bag, right-aligned with it,
 * flipping above the bag when there is no room below and clamped to the viewport.
 */
export function attachedPanelPosition(bag: Point, bagSize: Size, viewport: Rect, panelSize: Size, gap: number, margin = 0): Point {
    let x = bag.x + bagSize.width / 2 - panelSize.width
    let y = bag.y + bagSize.height / 2 + gap

    if (y + panelSize.height > viewport.y + viewport.height - margin) {
        y = bag.y - bagSize.height / 2 - gap - panelSize.height
    }

    const maxX = Math.max(viewport.x + margin, viewport.x + viewport.width - panelSize.width - margin)
    const maxY = Math.max(viewport.y + margin, viewport.y + viewport.height - panelSize.height - margin)

    x = clamp(x, viewport.x + margin, maxX)
    y = clamp(y, viewport.y + margin, maxY)

    return { x, y }
}

/**
 * Lays out the backpack grid from the number of items per category. The grid
 * starts as narrow as the content needs, grows up to `maxColumns`, assigns each
 * category a contiguous run of rows (so a divider never splits a row) and
 * reports how much of the content must be scrolled into view.
 */
export function bagContentLayout(counts: Record<InventoryCategory, number>, metrics: GridMetrics): BagContentLayout {
    const maxColumns = Math.max(1, Math.floor(metrics.maxColumns))
    const safeCounts = INVENTORY_CATEGORIES.map((category) => Math.max(0, Math.floor(counts[category] ?? 0)))
    const widest = safeCounts.reduce((widest, count) => Math.max(widest, count), 0)
    const columns = Math.max(1, Math.min(maxColumns, widest))

    const runs: CategoryRun[] = []
    let row = 0

    INVENTORY_CATEGORIES.forEach((category, index) => {
        const count = safeCounts[index]
        if (count === 0) return

        const rows = Math.ceil(count / columns)
        runs.push({ category, startRow: row, rows, count })
        row += rows
    })

    const rows = row
    const rowStride = metrics.slotSize + metrics.gap
    const runHeight = (run: CategoryRun) => run.rows * metrics.slotSize + (run.rows - 1) * metrics.gap

    const rowTops: number[] = []
    const dividerTops: number[] = []
    let cursor = 0

    runs.forEach((run, index) => {
        if (index > 0) {
            dividerTops.push(cursor)
            cursor += metrics.dividerHeight
        }

        for (let local = 0; local < run.rows; local++) {
            rowTops.push(cursor + local * rowStride)
        }

        cursor += runHeight(run)
    })

    const contentHeight = cursor
    const visibleRows = Math.min(rows, Math.max(1, Math.floor(metrics.maxRows)))
    const visibleRunHeight = Math.max(0, visibleRows * metrics.slotSize + Math.max(0, visibleRows - 1) * metrics.gap)
    // A divider only takes room inside the window when it sits between two visible rows.
    const visibleDividers = Math.min(Math.max(0, runs.length - 1), Math.max(0, visibleRows - 1))
    const viewportHeight = Math.min(contentHeight, visibleRunHeight + visibleDividers * metrics.dividerHeight)

    return {
        columns,
        rows,
        visibleRows,
        runs,
        rowTops,
        dividerTops,
        contentHeight,
        viewportHeight,
        scrollRange: Math.max(0, contentHeight - viewportHeight),
        gridWidth: columns * metrics.slotSize + (columns - 1) * metrics.gap,
    }
}

/** Content-local rect of one cell. `rowTop` comes from `BagContentLayout.rowTops`. */
export function cellRect(column: number, rowTop: number, origin: Point, metrics: GridMetrics): Rect {
    return {
        x: origin.x + column * (metrics.slotSize + metrics.gap),
        y: origin.y + rowTop,
        width: metrics.slotSize,
        height: metrics.slotSize,
    }
}

/**
 * Maps a content-local point to the cell under it. Points that fall on a gap or
 * outside the grid return `undefined`.
 */
export function cellAt(x: number, y: number, layout: BagContentLayout, metrics: GridMetrics): { row: number; column: number } | undefined {
    const stride = metrics.slotSize + metrics.gap
    const gridWidth = layout.columns * stride - metrics.gap

    if (x < 0 || x >= gridWidth) return undefined

    const column = Math.floor(x / stride)
    if (x - column * stride > metrics.slotSize) return undefined

    const row = layout.rowTops.findIndex((top) => y >= top && y <= top + metrics.slotSize)
    if (row < 0) return undefined

    return { row, column }
}

/**
 * Resolves a cell to the item it holds. Cells at the end of a category run stay
 * empty on purpose, so they resolve to `undefined`.
 */
export function categoryIndexAt(layout: BagContentLayout, row: number, column: number): { category: InventoryCategory; index: number } | undefined {
    if (column < 0 || column >= layout.columns || row < 0 || row >= layout.rows) return undefined

    for (const run of layout.runs) {
        if (row < run.startRow || row >= run.startRow + run.rows) continue

        const index = (row - run.startRow) * layout.columns + column
        if (index >= run.count) return undefined

        return { category: run.category, index }
    }

    return undefined
}

/** Keeps a scroll offset inside the range allowed by the content. */
export function clampScroll(offset: number, scrollRange: number): number {
    return clamp(offset, 0, Math.max(0, scrollRange))
}

/** Track and thumb geometry, or `undefined` when the content fits. */
export function scrollbarGeometry(track: Rect, contentHeight: number, viewportHeight: number, offset: number): ScrollbarGeometry | undefined {
    if (viewportHeight <= 0 || contentHeight <= viewportHeight || track.height <= 0) return undefined

    const scrollRange = contentHeight - viewportHeight
    const thumbHeight = Math.min(track.height, Math.max(MIN_SCROLLBAR_THUMB, track.height * (viewportHeight / contentHeight)))
    const thumbTravel = Math.max(0, track.height - thumbHeight)
    const progress = scrollRange > 0 ? clampScroll(offset, scrollRange) / scrollRange : 0

    return {
        track,
        thumb: { x: track.x, y: track.y + progress * thumbTravel, width: track.width, height: thumbHeight },
        thumbTravel,
    }
}

/** Scroll offset that puts the thumb at `thumbTop`. */
export function scrollOffsetFromThumb(thumbTop: number, geometry: ScrollbarGeometry, scrollRange: number): number {
    if (geometry.thumbTravel <= 0) return 0

    const progress = clamp((thumbTop - geometry.track.y) / geometry.thumbTravel, 0, 1)
    return progress * Math.max(0, scrollRange)
}
