import { describe, expect, it } from "vitest"
import {
    BAG_CORNERS,
    clampToRegion,
    cornerSpawnPosition,
    paginate,
    panelPosition,
    rectContains,
    slotRects,
} from "../../src/game/systems/Items/InventoryBagLayout"

/** Deterministic `random()` that walks a fixed sequence. */
function sequence(values: number[]): () => number {
    let index = 0
    return () => values[Math.min(index++, values.length - 1)]
}

const region = { x: 0, y: 0, width: 400, height: 300 }
const bagSize = { width: 40, height: 40 }
const viewport = { x: 0, y: 0, width: 768, height: 768 }

describe("inventory bag clamping", () => {
    it("keeps an in-bounds position untouched", () => {
        expect(clampToRegion({ x: 200, y: 150 }, region, bagSize)).toEqual({ x: 200, y: 150 })
    })

    it("clamps a position that would push the box outside the region", () => {
        expect(clampToRegion({ x: -50, y: 500 }, region, bagSize)).toEqual({ x: 20, y: 280 })
    })

    it("centres the box when the region is smaller than it", () => {
        const small = { x: 10, y: 10, width: 20, height: 20 }

        expect(clampToRegion({ x: 0, y: 0 }, small, bagSize)).toEqual({ x: 20, y: 20 })
    })

    it("reports containment for the panel hit test", () => {
        const rect = { x: 100, y: 100, width: 200, height: 200 }

        expect(rectContains(rect, 100, 100)).toBe(true)
        expect(rectContains(rect, 300, 300)).toBe(true)
        expect(rectContains(rect, 99, 150)).toBe(false)
        expect(rectContains(rect, 150, 301)).toBe(false)
    })
})

describe("inventory bag spawn", () => {
    it("spawns on each corner of the region without jitter", () => {
        const expected = [
            { corner: "top-left", x: 20, y: 20 },
            { corner: "top-right", x: 380, y: 20 },
            { corner: "bottom-left", x: 20, y: 280 },
            { corner: "bottom-right", x: 380, y: 280 },
        ]

        BAG_CORNERS.forEach((corner, index) => {
            const sampledCorner = (index + 0.5) / BAG_CORNERS.length
            const spawn = cornerSpawnPosition(region, bagSize, sequence([sampledCorner, 0.5, 0.5]))

            expect(spawn.corner).toBe(corner)
            expect(spawn.position).toEqual({ x: expected[index].x, y: expected[index].y })
        })
    })

    it("respects the inset away from the region border", () => {
        const spawn = cornerSpawnPosition(region, bagSize, sequence([0, 0.5, 0.5]), 10)

        expect(spawn.position).toEqual({ x: 30, y: 30 })
    })

    it("never spawns outside the region, even with a big jitter", () => {
        for (const corner of BAG_CORNERS) {
            for (const extreme of [0, 1]) {
                const spawn = cornerSpawnPosition(region, bagSize, sequence([BAG_CORNERS.indexOf(corner) / BAG_CORNERS.length, extreme, extreme]), 4, 90)

                expect(spawn.position.x).toBeGreaterThanOrEqual(20)
                expect(spawn.position.x).toBeLessThanOrEqual(380)
                expect(spawn.position.y).toBeGreaterThanOrEqual(20)
                expect(spawn.position.y).toBeLessThanOrEqual(280)
            }
        }
    })
})

describe("inventory panel placement", () => {
    const panelSize = { width: 226, height: 444 }

    it("places the panel on the right when the bag is on the left half", () => {
        const position = panelPosition({ x: 200, y: 400 }, bagSize, viewport, panelSize, 10, 10)

        expect(position.x).toBe(200 + bagSize.width / 2 + 10)
    })

    it("places the panel on the left when the bag is on the right half", () => {
        const position = panelPosition({ x: 600, y: 400 }, bagSize, viewport, panelSize, 10, 10)

        expect(position.x).toBe(600 - bagSize.width / 2 - 10 - panelSize.width)
    })

    it("keeps the panel fully inside the viewport vertically", () => {
        const top = panelPosition({ x: 200, y: 20 }, bagSize, viewport, panelSize, 10, 10)
        const bottom = panelPosition({ x: 200, y: 760 }, bagSize, viewport, panelSize, 10, 10)

        expect(top.y).toBe(10)
        expect(bottom.y).toBe(viewport.height - panelSize.height - 10)
    })

    it("never lets the panel leave the viewport horizontally", () => {
        const huge = { width: 700, height: 200 }

        for (const x of [20, 200, 384, 600, 748]) {
            const position = panelPosition({ x, y: 400 }, bagSize, viewport, huge, 10, 10)

            expect(position.x).toBeGreaterThanOrEqual(10)
            expect(position.x + huge.width).toBeLessThanOrEqual(viewport.width - 10)
        }
    })
})

describe("inventory pagination", () => {
    const items = Array.from({ length: 10 }, (_value, index) => index + 1)

    it("splits items into fixed size pages", () => {
        const first = paginate(items, 0, 4)
        const second = paginate(items, 1, 4)
        const third = paginate(items, 2, 4)

        expect(first.pageCount).toBe(3)
        expect(first.items).toEqual([1, 2, 3, 4])
        expect(first.offset).toBe(0)
        expect(second.items).toEqual([5, 6, 7, 8])
        expect(second.offset).toBe(4)
        expect(third.items).toEqual([9, 10])
    })

    it("clamps a page outside the available range", () => {
        expect(paginate(items, 99, 4).items).toEqual([9, 10])
        expect(paginate(items, -3, 4).items).toEqual([1, 2, 3, 4])
    })

    it("always reports a single page for an empty list", () => {
        const page = paginate([], 3, 4)

        expect(page.pageCount).toBe(1)
        expect(page.page).toBe(0)
        expect(page.items).toEqual([])
    })

    it("never loses items across pages", () => {
        const perPage = 3
        const collected: number[] = []

        for (let page = 0; page < paginate(items, 0, perPage).pageCount; page++) {
            collected.push(...paginate(items, page, perPage).items)
        }

        expect(collected).toEqual(items)
    })
})

describe("inventory slot geometry", () => {
    it("builds row-major slot rects from the origin", () => {
        const rects = slotRects({ x: 10, y: 20 }, 2, 2, 46, 6)

        expect(rects).toEqual([
            { x: 10, y: 20, width: 46, height: 46 },
            { x: 62, y: 20, width: 46, height: 46 },
            { x: 10, y: 72, width: 46, height: 46 },
            { x: 62, y: 72, width: 46, height: 46 },
        ])
    })

    it("returns no slots for zero rows", () => {
        expect(slotRects({ x: 0, y: 0 }, 4, 0, 46, 6)).toEqual([])
    })
})
