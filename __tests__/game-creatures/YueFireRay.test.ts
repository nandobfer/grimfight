import { describe, expect, it } from "vitest"
import { calculateYueFireRayDamage, YUE_FIRE_RAY_DAMAGE_AP_RATIO, YUE_FIRE_RAY_DURATION_MS } from "../../src/game/creature/classes/YueFireRay"

describe("Yue fire ray", () => {
    it("calculates base damage from 50 percent AP", () => {
        expect(YUE_FIRE_RAY_DAMAGE_AP_RATIO).toBe(0.5)
        expect(calculateYueFireRayDamage(100)).toBe(50)
    })

    it("supports ability multipliers without changing the configured duration", () => {
        expect(calculateYueFireRayDamage(100, 2)).toBe(100)
        expect(YUE_FIRE_RAY_DURATION_MS).toBe(500)
    })

    it("returns zero damage for zero AP", () => {
        expect(calculateYueFireRayDamage(0)).toBe(0)
    })
})
