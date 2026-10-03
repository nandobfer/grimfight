import { describe, expect, it } from "vitest"
import {
    calculateCloverDarkCleaveDamage,
    CLOVER_DARK_CLEAVE_AD_RATIO,
    CLOVER_DARK_CLEAVE_HIT_RADIUS,
    CLOVER_DARK_CLEAVE_MAX_ANGLE_OFFSET,
    getCloverWallContact,
    pickCloverDarkCleaveAngle,
    distancePointToSegment,
    doesCloverDarkCleaveSegmentHit,
} from "../../src/game/creature/classes/CloverDarkCleave"

describe("CloverDarkCleave", () => {
    it("calculates finite non-negative AD-scaled damage", () => {
        const baseDamage = calculateCloverDarkCleaveDamage(30)
        const doubledDamage = calculateCloverDarkCleaveDamage(60)

        expect(baseDamage).toBeGreaterThan(0)
        expect(Number.isFinite(baseDamage)).toBe(true)
        expect(baseDamage).toBeCloseTo(30 * CLOVER_DARK_CLEAVE_AD_RATIO)
        expect(doubledDamage).toBeCloseTo(baseDamage * 2)
        expect(calculateCloverDarkCleaveDamage(-10)).toBe(0)
        expect(calculateCloverDarkCleaveDamage(Number.NaN)).toBe(0)
    })

    it("preserves random deviation while keeping the target inside the swept hit area", () => {
        const origin = { x: 0, y: 0 }
        for (const target of [{ x: 60, y: 12 }, { x: -600, y: 220 }, { x: 0, y: -300 }]) {
            for (const sign of [-1, 1]) {
                const angle = pickCloverDarkCleaveAngle(origin, target, sign * CLOVER_DARK_CLEAVE_MAX_ANGLE_OFFSET)
                const distance = Math.hypot(target.x, target.y) + CLOVER_DARK_CLEAVE_HIT_RADIUS
                expect(doesCloverDarkCleaveSegmentHit(target, origin, { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance })).toBe(true)
                expect(angle).not.toBe(Math.atan2(target.y, target.x))
            }
        }
    })

    it("finds wall contact even when a frame crosses the entire wall", () => {
        const wall = { left: 100, right: 110, top: -50, bottom: 50 }
        expect(getCloverWallContact({ x: 0, y: 0 }, { x: 200, y: 0 }, wall)).toBeCloseTo(0.5)
        expect(getCloverWallContact({ x: 200, y: 0 }, { x: 0, y: 0 }, wall)).toBeCloseTo(0.45)
        expect(getCloverWallContact({ x: 0, y: 80 }, { x: 200, y: 80 }, wall)).toBeUndefined()
        expect(getCloverWallContact({ x: 105, y: 0 }, { x: 105, y: 0 }, wall)).toBe(0)
        expect(getCloverWallContact({ x: 0, y: 0 }, { x: 200, y: 0 }, wall, 10)).toBeCloseTo(0.45)
    })

    it("detects hits against the moving slash segment", () => {
        const start = { x: 0, y: 0 }
        const end = { x: 100, y: 0 }

        expect(distancePointToSegment({ x: 50, y: 12 }, start, end)).toBeCloseTo(12)
        expect(doesCloverDarkCleaveSegmentHit({ x: 50, y: CLOVER_DARK_CLEAVE_HIT_RADIUS - 1 }, start, end)).toBe(true)
        expect(doesCloverDarkCleaveSegmentHit({ x: 50, y: CLOVER_DARK_CLEAVE_HIT_RADIUS + 8 }, start, end)).toBe(false)
    })

    it("keeps enough lateral tolerance for the target hit point", () => {
        const start = { x: 0, y: 0 }
        const end = { x: 120, y: 28 }

        expect(doesCloverDarkCleaveSegmentHit({ x: 72, y: 2 }, start, end)).toBe(true)
    })
})
