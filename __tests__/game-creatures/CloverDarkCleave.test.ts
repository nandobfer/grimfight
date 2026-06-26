import { describe, expect, it } from "vitest"
import {
    calculateCloverDarkCleaveDamage,
    clampCloverDarkCleaveLength,
    clampCloverDarkCleaveRange,
    CLOVER_DARK_CLEAVE_HIT_RADIUS,
    CLOVER_DARK_CLEAVE_MAX_LENGTH,
    CLOVER_DARK_CLEAVE_MAX_RANGE,
    CLOVER_DARK_CLEAVE_MIN_LENGTH,
    CLOVER_DARK_CLEAVE_MIN_RANGE,
    distancePointToSegment,
    doesCloverDarkCleaveSegmentHit,
} from "../../src/game/creature/classes/CloverDarkCleave"

describe("CloverDarkCleave", () => {
    it("calculates finite non-negative AD-scaled damage", () => {
        const baseDamage = calculateCloverDarkCleaveDamage(30)
        const doubledDamage = calculateCloverDarkCleaveDamage(60)

        expect(baseDamage).toBeGreaterThan(0)
        expect(Number.isFinite(baseDamage)).toBe(true)
        expect(doubledDamage).toBeCloseTo(baseDamage * 2)
        expect(calculateCloverDarkCleaveDamage(-10)).toBe(0)
        expect(calculateCloverDarkCleaveDamage(Number.NaN)).toBe(0)
    })

    it("clamps range while keeping enough distance to reach the target", () => {
        expect(clampCloverDarkCleaveRange(0, 0)).toBe(CLOVER_DARK_CLEAVE_MIN_RANGE)
        expect(clampCloverDarkCleaveRange(9999, 9999)).toBe(CLOVER_DARK_CLEAVE_MAX_RANGE)
        expect(clampCloverDarkCleaveRange(260, CLOVER_DARK_CLEAVE_MIN_RANGE)).toBeGreaterThanOrEqual(260 + CLOVER_DARK_CLEAVE_HIT_RADIUS * 2)
    })

    it("clamps visual slash length", () => {
        expect(clampCloverDarkCleaveLength(0)).toBe(CLOVER_DARK_CLEAVE_MIN_LENGTH)
        expect(clampCloverDarkCleaveLength(9999)).toBe(CLOVER_DARK_CLEAVE_MAX_LENGTH)
    })

    it("detects hits against the moving slash segment", () => {
        const start = { x: 0, y: 0 }
        const end = { x: 100, y: 0 }

        expect(distancePointToSegment({ x: 50, y: 12 }, start, end)).toBeCloseTo(12)
        expect(doesCloverDarkCleaveSegmentHit({ x: 50, y: CLOVER_DARK_CLEAVE_HIT_RADIUS - 1 }, start, end)).toBe(true)
        expect(doesCloverDarkCleaveSegmentHit({ x: 50, y: CLOVER_DARK_CLEAVE_HIT_RADIUS + 8 }, start, end)).toBe(false)
    })
})
