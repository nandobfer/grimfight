import { describe, expect, it } from "vitest"
import { calculateYueFireRayDamage, YUE_FIRE_RAY_DURATION_MS } from "../../src/game/creature/classes/YueFireRay"

describe("Yue fire ray", () => {
    it("calculates finite non-negative damage from AP", () => {
        const damage = calculateYueFireRayDamage(100)

        expect(Number.isFinite(damage)).toBe(true)
        expect(damage).toBeGreaterThanOrEqual(0)
    })

    it("supports ability multipliers without changing the configured duration", () => {
        const baseDamage = calculateYueFireRayDamage(100)
        const multiplier = 2

        expect(calculateYueFireRayDamage(100, multiplier)).toBe(baseDamage * multiplier)
        expect(Number.isFinite(YUE_FIRE_RAY_DURATION_MS)).toBe(true)
        expect(YUE_FIRE_RAY_DURATION_MS).toBeGreaterThan(0)
    })
})
