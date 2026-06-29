import { describe, expect, it } from "vitest"
import { calculateFeralStatBonus, FERAL_THREATENED_HEALTH_RATIO, isFeralThreatened } from "../../src/game/systems/Traits/formulas/FeralTraitFormulas"

describe("FeralTraitFormulas", () => {
    it("treats a creature as threatened at or below the health threshold", () => {
        expect(isFeralThreatened(FERAL_THREATENED_HEALTH_RATIO * 100, 100)).toBe(true)
        expect(isFeralThreatened(FERAL_THREATENED_HEALTH_RATIO * 100 + 1, 100)).toBe(false)
    })

    it("does not treat invalid maximum health as threatened", () => {
        expect(isFeralThreatened(0, 0)).toBe(false)
        expect(isFeralThreatened(-1, 0)).toBe(false)
    })

    it("doubles the stat bonus when threatened", () => {
        const baseValue = 120
        const multiplier = 0.25

        expect(calculateFeralStatBonus(baseValue, multiplier, false)).toBe(baseValue * multiplier)
        expect(calculateFeralStatBonus(baseValue, multiplier, true)).toBe(baseValue * multiplier * 2)
    })
})
