import { describe, expect, it } from "vitest"
import {
    attachedPanelPosition,
    bagContentLayout,
    categoryIndexAt,
    cellAt,
    cellRect,
    clampScroll,
    clampToRegion,
    GridMetrics,
    rectContains,
    scrollbarGeometry,
    scrollOffsetFromThumb,
    topRightAnchor,
} from "../../src/game/systems/Items/InventoryBagLayout"

/** Mirrors the values the Phaser backpack uses. */
const metrics: GridMetrics = { slotSize: 46, gap: 6, dividerHeight: 26, maxColumns: 5, maxRows: 3 }

const region = { x: 0, y: 0, width: 400, height: 300 }
const bagSize = { width: 74, height: 74 }
const viewport = { x: 0, y: 0, width: 768, height: 768 }

const rowHeight = metrics.slotSize
const rowStride = metrics.slotSize + metrics.gap

function counts(artifact = 0, completed = 0, component = 0) {
    return { artifact, completed, component }
}

describe("inventory bag clamping", () => {
    it("keeps an in-bounds position untouched", () => {
        expect(clampToRegion({ x: 200, y: 150 }, region, bagSize)).toEqual({ x: 200, y: 150 })
    })

    it("clamps a position that would push the box outside the region", () => {
        expect(clampToRegion({ x: -50, y: 500 }, region, { width: 40, height: 40 })).toEqual({ x: 20, y: 280 })
    })

    it("centres the box when the region is smaller than it", () => {
        const small = { x: 10, y: 10, width: 20, height: 20 }

        expect(clampToRegion({ x: 0, y: 0 }, small, { width: 40, height: 40 })).toEqual({ x: 20, y: 20 })
    })

    it("reports containment for the panel hit test", () => {
        const rect = { x: 100, y: 100, width: 200, height: 200 }

        expect(rectContains(rect, 100, 100)).toBe(true)
        expect(rectContains(rect, 300, 300)).toBe(true)
        expect(rectContains(rect, 99, 150)).toBe(false)
        expect(rectContains(rect, 150, 301)).toBe(false)
    })
})

describe("inventory bag anchor", () => {
    it("anchors the icon to the top-right corner of the arena", () => {
        const anchor = topRightAnchor(region, bagSize, 6)

        expect(anchor).toEqual({ x: region.width - 6 - bagSize.width / 2, y: 6 + bagSize.height / 2 })
    })

    it("never lets the anchored box leave the arena", () => {
        for (const margin of [0, 6, 40]) {
            const anchor = topRightAnchor(region, bagSize, margin)

            expect(anchor.x - bagSize.width / 2).toBeGreaterThanOrEqual(region.x)
            expect(anchor.x + bagSize.width / 2).toBeLessThanOrEqual(region.x + region.width)
            expect(anchor.y - bagSize.height / 2).toBeGreaterThanOrEqual(region.y)
        }
    })

    it("centres an oversized box instead of pushing it outside", () => {
        const anchor = topRightAnchor(region, { width: 900, height: 40 }, 6)

        expect(anchor.x).toBe(region.width / 2)
    })
})

describe("inventory panel placement", () => {
    const panelSize = { width: 254, height: 200 }

    it("hangs the panel below the bag, right-aligned with it", () => {
        const bag = topRightAnchor(region, bagSize, 6)
        const position = attachedPanelPosition(bag, bagSize, viewport, panelSize, 12, 8)

        expect(position.x + panelSize.width).toBe(bag.x + bagSize.width / 2)
        expect(position.y).toBe(bag.y + bagSize.height / 2 + 12)
    })

    it("flips above the bag when there is no room below", () => {
        const bag = { x: 700, y: viewport.height - 40 }
        const position = attachedPanelPosition(bag, bagSize, viewport, panelSize, 12, 8)

        expect(position.y).toBe(bag.y - bagSize.height / 2 - 12 - panelSize.height)
    })

    it("always keeps the panel inside the viewport", () => {
        const huge = { width: 700, height: 700 }

        for (const bag of [
            { x: 40, y: 40 },
            { x: 384, y: 384 },
            { x: 740, y: 740 },
        ]) {
            const position = attachedPanelPosition(bag, bagSize, viewport, huge, 12, 8)

            expect(position.x).toBeGreaterThanOrEqual(8)
            expect(position.x + huge.width).toBeLessThanOrEqual(viewport.width - 8)
            expect(position.y).toBeGreaterThanOrEqual(8)
            expect(position.y + huge.height).toBeLessThanOrEqual(viewport.height - 8)
        }
    })
})

describe("inventory grid growth", () => {
    it("reports an empty grid with no rows", () => {
        const layout = bagContentLayout(counts(), metrics)

        expect(layout.rows).toBe(0)
        expect(layout.runs).toEqual([])
        expect(layout.contentHeight).toBe(0)
        expect(layout.viewportHeight).toBe(0)
        expect(layout.scrollRange).toBe(0)
    })

    it("starts as narrow as the content needs", () => {
        expect(bagContentLayout(counts(0, 0, 1), metrics).columns).toBe(1)
        expect(bagContentLayout(counts(0, 0, 3), metrics).columns).toBe(3)
        expect(bagContentLayout(counts(0, 0, 3), metrics).gridWidth).toBe(3 * rowHeight + 2 * metrics.gap)
    })

    it("caps the width at five columns and wraps into new rows", () => {
        const six = bagContentLayout(counts(0, 0, 6), metrics)

        expect(six.columns).toBe(5)
        expect(six.rows).toBe(2)
        expect(six.viewportHeight).toBe(2 * rowHeight + metrics.gap)
        expect(six.scrollRange).toBe(0)
    })

    it("keeps three rows visible and scrolls once they overflow", () => {
        const full = bagContentLayout(counts(0, 0, 15), metrics)
        const overflow = bagContentLayout(counts(0, 0, 16), metrics)

        expect(full.rows).toBe(3)
        expect(full.viewportHeight).toBe(3 * rowHeight + 2 * metrics.gap)
        expect(full.scrollRange).toBe(0)

        expect(overflow.rows).toBe(4)
        expect(overflow.viewportHeight).toBe(full.viewportHeight)
        expect(overflow.scrollRange).toBe(overflow.contentHeight - overflow.viewportHeight)
        expect(overflow.scrollRange).toBeGreaterThan(0)
        expect(overflow.columns).toBe(5)
    })

    it("fits three single-item dividers without scrolling", () => {
        const layout = bagContentLayout(counts(1, 1, 1), metrics)

        expect(layout.columns).toBe(1)
        expect(layout.rows).toBe(3)
        expect(layout.runs).toHaveLength(3)
        expect(layout.dividerTops).toHaveLength(2)
        expect(layout.contentHeight).toBe(3 * rowHeight + 2 * metrics.dividerHeight)
        expect(layout.scrollRange).toBe(0)
    })

    it("gives every category a contiguous run so a divider never splits a row", () => {
        const layout = bagContentLayout(counts(7, 1, 6), metrics)

        expect(layout.columns).toBe(5)
        expect(layout.runs).toEqual([
            { category: "artifact", startRow: 0, rows: 2, count: 7 },
            { category: "completed", startRow: 2, rows: 1, count: 1 },
            { category: "component", startRow: 3, rows: 2, count: 6 },
        ])
        expect(layout.rows).toBe(5)
        expect(layout.dividerTops).toHaveLength(2)
        expect(layout.rowTops).toHaveLength(5)
        expect(layout.scrollRange).toBeGreaterThan(0)
    })

    it("keeps row tops and divider tops ordered inside the content", () => {
        const layout = bagContentLayout(counts(7, 1, 6), metrics)

        expect(layout.rowTops[0]).toBe(0)
        for (let index = 1; index < layout.rowTops.length; index++) {
            expect(layout.rowTops[index]).toBeGreaterThan(layout.rowTops[index - 1])
        }
        for (const top of layout.dividerTops) {
            expect(top).toBeGreaterThan(0)
            expect(top).toBeLessThan(layout.contentHeight)
        }
        expect(layout.contentHeight).toBeLessThanOrEqual(layout.rows * rowStride + layout.dividerTops.length * metrics.dividerHeight)
    })
})

describe("inventory cell hit testing", () => {
    it("builds row-major rects from the row top and column", () => {
        expect(cellRect(1, 0, { x: 10, y: 20 }, metrics)).toEqual({ x: 10 + rowStride, y: 20, width: rowHeight, height: rowHeight })
    })

    it("round-trips a cell centre back to its category index", () => {
        const layout = bagContentLayout(counts(2, 0, 4), metrics)

        for (const run of layout.runs) {
            for (let index = 0; index < run.count; index++) {
                const row = run.startRow + Math.floor(index / layout.columns)
                const column = index % layout.columns
                const rect = cellRect(column, layout.rowTops[row], { x: 0, y: 0 }, metrics)
                const cell = cellAt(rect.x + rect.width / 2, rect.y + rect.height / 2, layout, metrics)

                expect(cell).toEqual({ row, column })
                expect(categoryIndexAt(layout, cell!.row, cell!.column)).toEqual({ category: run.category, index })
            }
        }
    })

    it("resolves the empty cells at the end of a run to nothing", () => {
        const layout = bagContentLayout(counts(7, 1, 6), metrics)

        // The artifact run fills 5 + 2 cells, so its second row has three free cells.
        expect(categoryIndexAt(layout, 1, 1)).toEqual({ category: "artifact", index: 6 })
        expect(categoryIndexAt(layout, 1, 2)).toBeUndefined()
        expect(categoryIndexAt(layout, 2, 1)).toBeUndefined()
    })

    it("ignores points on a gap or outside the grid", () => {
        const layout = bagContentLayout(counts(1, 1, 0), metrics)

        expect(cellAt(-1, 0, layout, metrics)).toBeUndefined()
        expect(cellAt(0, layout.dividerTops[0] + 1, layout, metrics)).toBeUndefined()
        expect(cellAt(0, layout.contentHeight + 10, layout, metrics)).toBeUndefined()
        expect(cellAt(rowStride * layout.columns, 0, layout, metrics)).toBeUndefined()
    })
})

describe("inventory scrollbar", () => {
    const track = { x: 240, y: 50, width: 8, height: 150 }

    it("has no scrollbar when the content fits", () => {
        expect(scrollbarGeometry(track, 150, 150, 0)).toBeUndefined()
        expect(scrollbarGeometry(track, 100, 150, 0)).toBeUndefined()
    })

    it("sizes the thumb from the visible fraction and never below the minimum", () => {
        const long = scrollbarGeometry(track, 600, 150, 0)
        const huge = scrollbarGeometry(track, 3000, 150, 0)

        expect(long?.thumb.height).toBeGreaterThan(0)
        expect(long?.thumb.height).toBeLessThan(track.height)
        expect(long?.thumb.height).toBeCloseTo((track.height * 150) / 600)
        expect(huge?.thumb.height).toBe(24)
    })

    it("moves the thumb from the top to the bottom of the track", () => {
        const range = 202 - 150
        const top = scrollbarGeometry(track, 202, 150, 0)
        const bottom = scrollbarGeometry(track, 202, 150, range)

        expect(top?.thumb.y).toBe(track.y)
        expect(bottom?.thumb.y).toBeCloseTo(track.y + (bottom?.thumbTravel ?? 0))
    })

    it("round-trips a thumb drag back to the scroll offset", () => {
        const range = 202 - 150
        const geometry = scrollbarGeometry(track, 202, 150, 0)
        const dragged = scrollbarGeometry(track, 202, 150, range / 2)

        expect(dragged).toBeDefined()
        expect(scrollOffsetFromThumb(dragged!.thumb.y, dragged!, range)).toBeCloseTo(range / 2)
        expect(scrollOffsetFromThumb(geometry!.thumb.y, geometry!, range)).toBe(0)
        expect(scrollOffsetFromThumb(track.y + track.height, geometry!, range)).toBe(range)
    })

    it("clamps the scroll offset into the allowed range", () => {
        expect(clampScroll(-20, 100)).toBe(0)
        expect(clampScroll(60, 100)).toBe(60)
        expect(clampScroll(500, 100)).toBe(100)
        expect(clampScroll(50, 0)).toBe(0)
    })
})
