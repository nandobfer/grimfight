import { describe, expect, it } from "vitest"
import {
    calculateFandralFlameSlashBurnTickDamage,
    calculateFandralFlameSlashBurnTotalDamage,
    calculateFandralFlameSlashDirectDamage,
    doFandralFlameSlashBoundsIntersect,
    expandFandralFlameSlashBounds,
    expandFandralFlameSlashBoundsForVisualSweep,
    getFandralFlameSlashBurnTickCount,
    getFandralFlameSlashCells,
    isPointInsideFandralFlameSlashBounds,
} from "../../src/game/creature/classes/FandralFlameSlash"

describe("Fandral Flame Slash", () => {
    it("splits ability damage evenly between direct damage and burning", () => {
        const abilityPower = 80
        const multiplier = 1.3

        const directDamage = calculateFandralFlameSlashDirectDamage(abilityPower, multiplier)
        const burnTotalDamage = calculateFandralFlameSlashBurnTotalDamage(abilityPower, multiplier)

        expect(Number.isFinite(directDamage)).toBe(true)
        expect(Number.isFinite(burnTotalDamage)).toBe(true)
        expect(directDamage).toBeGreaterThanOrEqual(0)
        expect(burnTotalDamage).toBeGreaterThanOrEqual(0)
        expect(burnTotalDamage).toBe(directDamage)
    })

    it("derives each burn tick from the configured total burn window", () => {
        const abilityPower = 120
        const tickDamage = calculateFandralFlameSlashBurnTickDamage(abilityPower)
        const burnTotalDamage = calculateFandralFlameSlashBurnTotalDamage(abilityPower)

        expect(Number.isFinite(tickDamage)).toBe(true)
        expect(tickDamage).toBeGreaterThanOrEqual(0)
        expect(tickDamage * getFandralFlameSlashBurnTickCount()).toBeCloseTo(burnTotalDamage)
    })

    it("builds a horizontal cell line when Fandral faces vertically", () => {
        const cells = getFandralFlameSlashCells({ col: 4, row: 5 }, "up", 9, 9)

        expect(cells).toEqual([
            { col: 3, row: 5 },
            { col: 4, row: 5 },
            { col: 5, row: 5 },
        ])
    })

    it("builds a vertical cell line when Fandral faces horizontally", () => {
        const cells = getFandralFlameSlashCells({ col: 4, row: 5 }, "right", 9, 9)

        expect(cells).toEqual([
            { col: 4, row: 4 },
            { col: 4, row: 5 },
            { col: 4, row: 6 },
        ])
    })

    it("expands the hit bounds around the same center", () => {
        const expanded = expandFandralFlameSlashBounds({ minX: 10, maxX: 110, minY: 20, maxY: 60 })

        expect(expanded.minX).toBeCloseTo(-2.5)
        expect(expanded.maxX).toBeCloseTo(122.5)
        expect(expanded.minY).toBeCloseTo(15)
        expect(expanded.maxY).toBeCloseTo(65)
        expect(isPointInsideFandralFlameSlashBounds(120, 64, expanded)).toBe(true)
        expect(isPointInsideFandralFlameSlashBounds(123, 64, expanded)).toBe(false)
    })

    it("expands horizontal hit bounds to include the full visual sweep", () => {
        const bounds = expandFandralFlameSlashBoundsForVisualSweep({ minX: 100, maxX: 300, minY: 200, maxY: 260 }, "up", 50, 60, 5)

        expect(bounds).toEqual({
            minX: 81,
            maxX: 319,
            minY: 195,
            maxY: 265,
        })
    })

    it("expands vertical hit bounds to include the full visual sweep", () => {
        const bounds = expandFandralFlameSlashBoundsForVisualSweep({ minX: 100, maxX: 160, minY: 200, maxY: 400 }, "right", 50, 60, 5)

        expect(bounds).toEqual({
            minX: 95,
            maxX: 165,
            minY: 178.2,
            maxY: 421.8,
        })
    })

    it("checks intersection instead of only a creature origin point", () => {
        const slashBounds = { minX: 100, maxX: 200, minY: 100, maxY: 200 }
        const overlappingCreatureBounds = { minX: 190, maxX: 230, minY: 150, maxY: 190 }
        const outsideCreatureBounds = { minX: 201, maxX: 230, minY: 150, maxY: 190 }

        expect(doFandralFlameSlashBoundsIntersect(slashBounds, overlappingCreatureBounds)).toBe(true)
        expect(doFandralFlameSlashBoundsIntersect(slashBounds, outsideCreatureBounds)).toBe(false)
    })
})
