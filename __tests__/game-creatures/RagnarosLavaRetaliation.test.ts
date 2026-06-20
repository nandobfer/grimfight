import { describe, expect, it } from "vitest"
import {
    calculateRagnarosLavaRetaliationDamage,
    getRagnarosLavaConePoints,
    isPointInsideRagnarosLavaCone,
    RAGNAROS_LAVA_RETALIATION_COOLDOWN_MS,
    RAGNAROS_LAVA_RETALIATION_RANGE,
} from "../../src/game/creature/classes/RagnarosLavaRetaliation"

describe("Ragnaros Lava Retaliation", () => {
    it("calculates finite AP-based retaliation damage", () => {
        const abilityPower = 120
        const baseDamage = calculateRagnarosLavaRetaliationDamage(abilityPower)
        const amplifiedDamage = calculateRagnarosLavaRetaliationDamage(abilityPower, 1.5)

        expect(Number.isFinite(baseDamage)).toBe(true)
        expect(baseDamage).toBeGreaterThanOrEqual(0)
        expect(amplifiedDamage).toBeCloseTo(baseDamage * 1.5)
    })

    it("exposes a positive finite cooldown", () => {
        expect(Number.isFinite(RAGNAROS_LAVA_RETALIATION_COOLDOWN_MS)).toBe(true)
        expect(RAGNAROS_LAVA_RETALIATION_COOLDOWN_MS).toBeGreaterThan(0)
    })

    it("detects points inside the forward lava cone", () => {
        const origin = { x: 0, y: 0 }
        const angle = 0

        expect(isPointInsideRagnarosLavaCone(origin, { x: RAGNAROS_LAVA_RETALIATION_RANGE * 0.5, y: 0 }, angle)).toBe(true)
        expect(isPointInsideRagnarosLavaCone(origin, { x: -RAGNAROS_LAVA_RETALIATION_RANGE * 0.5, y: 0 }, angle)).toBe(false)
        expect(isPointInsideRagnarosLavaCone(origin, { x: RAGNAROS_LAVA_RETALIATION_RANGE * 2, y: 0 }, angle)).toBe(false)
    })

    it("builds cone polygon points from the origin", () => {
        const origin = { x: 5, y: 8 }
        const points = getRagnarosLavaConePoints(origin, 0, RAGNAROS_LAVA_RETALIATION_RANGE, undefined, 6)

        expect(points[0]).toEqual(origin)
        expect(points.length).toBeGreaterThan(2)
        expect(points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true)
    })
})
