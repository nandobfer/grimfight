import { describe, expect, it } from "vitest"
import {
    calculateMaricuriCloudAverageStacks,
    calculateMaricuriCloudDotTotalRawDamage,
    calculateMaricuriCloudTickDamage,
    calculateMaricuriFlaskTickDamage,
    calculateMaricuriFlaskTotalRawDamage,
    clampMaricuriPointToBounds,
    MARICURI_BIG_FLASK_DOT_DURATION_MS,
    MARICURI_BIG_FLASK_DOT_TICK_RATE_MS,
    MARICURI_FLASK_DOT_DURATION_MS,
    MARICURI_FLASK_DOT_TICK_RATE_MS,
} from "../../src/game/creature/classes/MaricuriAlchemy"

describe("MaricuriAlchemy", () => {
    it("calculates finite non-negative flask and cloud tick damage", () => {
        expect(Number.isFinite(calculateMaricuriFlaskTickDamage(50))).toBe(true)
        expect(Number.isFinite(calculateMaricuriCloudTickDamage(50))).toBe(true)
        expect(calculateMaricuriFlaskTickDamage(-10)).toBe(0)
        expect(calculateMaricuriCloudTickDamage(-10)).toBe(0)
        expect(calculateMaricuriFlaskTickDamage(Number.NaN)).toBe(0)
        expect(calculateMaricuriCloudTickDamage(Number.NaN)).toBe(0)
    })

    it("scales flask tick damage with ability power and multiplier", () => {
        const base = calculateMaricuriFlaskTickDamage(40)
        const moreAbilityPower = calculateMaricuriFlaskTickDamage(80)

        expect(moreAbilityPower).toBeGreaterThan(base)
        expect(calculateMaricuriFlaskTickDamage(40, 2)).toBeGreaterThan(base)
        expect(calculateMaricuriFlaskTickDamage(40, 0)).toBe(0)
    })

    it("scales cloud tick damage with ability power and multiplier", () => {
        const base = calculateMaricuriCloudTickDamage(40)
        const moreAbilityPower = calculateMaricuriCloudTickDamage(80)

        expect(moreAbilityPower).toBeGreaterThan(base)
        expect(calculateMaricuriCloudTickDamage(40, 2)).toBeGreaterThan(base)
        expect(calculateMaricuriCloudTickDamage(40, 0)).toBe(0)
    })

    it("derives total raw damage from duration and tick rate", () => {
        const flaskTick = calculateMaricuriFlaskTickDamage(60)
        const flaskTicks = MARICURI_FLASK_DOT_DURATION_MS / MARICURI_FLASK_DOT_TICK_RATE_MS
        expect(calculateMaricuriFlaskTotalRawDamage(60)).toBeCloseTo(flaskTick * flaskTicks)

        const cloudTick = calculateMaricuriCloudTickDamage(60)
        const cloudTicks = MARICURI_BIG_FLASK_DOT_DURATION_MS / MARICURI_BIG_FLASK_DOT_TICK_RATE_MS
        expect(calculateMaricuriCloudDotTotalRawDamage(60)).toBeCloseTo(cloudTick * cloudTicks)
    })

    it("derives average poison stacks from dot duration and application interval", () => {
        expect(calculateMaricuriCloudAverageStacks(MARICURI_BIG_FLASK_DOT_DURATION_MS, MARICURI_BIG_FLASK_DOT_TICK_RATE_MS)).toBeCloseTo(
            MARICURI_BIG_FLASK_DOT_DURATION_MS / MARICURI_BIG_FLASK_DOT_TICK_RATE_MS
        )
        expect(calculateMaricuriCloudAverageStacks(1000, 0)).toBe(0)
        expect(calculateMaricuriCloudAverageStacks(Number.NaN, 500)).toBe(0)
    })

    it("clamps points to the arena bounds", () => {
        const bounds = { left: 0, top: 0, right: 100, bottom: 80 }

        expect(clampMaricuriPointToBounds(bounds, { x: -20, y: 200 })).toEqual({ x: 0, y: 80 })
        expect(clampMaricuriPointToBounds(bounds, { x: 50, y: 40 })).toEqual({ x: 50, y: 40 })
        expect(clampMaricuriPointToBounds(bounds, { x: Number.NaN, y: Number.NaN })).toEqual({ x: 0, y: 0 })
    })
})
