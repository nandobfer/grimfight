import { describe, expect, it } from "vitest"
import {
    calculateNalaSerpentDotTickDamage,
    calculateNalaSerpentDotTotalRawDamage,
    calculateNalaSerpentImpactDamage,
    calculateNalaSerpentTotalRawDamage,
    NALA_SERPENT_DOT_DURATION_MS,
    NALA_SERPENT_DOT_TICK_RATE_MS,
} from "../../src/game/creature/classes/NalaSerpents"

describe("NalaSerpents", () => {
    it("calculates finite non-negative impact and dot damage", () => {
        expect(Number.isFinite(calculateNalaSerpentImpactDamage(18, 45))).toBe(true)
        expect(Number.isFinite(calculateNalaSerpentDotTickDamage(18, 45))).toBe(true)
        expect(calculateNalaSerpentImpactDamage(-10, -10)).toBe(0)
        expect(calculateNalaSerpentDotTickDamage(Number.NaN, Number.NaN)).toBe(0)
    })

    it("scales impact damage with both attack damage and ability power", () => {
        const base = calculateNalaSerpentImpactDamage(20, 40)
        const moreAttackDamage = calculateNalaSerpentImpactDamage(40, 40)
        const moreAbilityPower = calculateNalaSerpentImpactDamage(20, 80)

        expect(moreAttackDamage).toBeGreaterThan(base)
        expect(moreAbilityPower).toBeGreaterThan(base)
    })

    it("scales poison dot with both attack damage and ability power", () => {
        const base = calculateNalaSerpentDotTickDamage(20, 40)
        const moreAttackDamage = calculateNalaSerpentDotTickDamage(40, 40)
        const moreAbilityPower = calculateNalaSerpentDotTickDamage(20, 80)

        expect(moreAttackDamage).toBeGreaterThan(base)
        expect(moreAbilityPower).toBeGreaterThan(base)
    })

    it("derives total poison dot damage from duration and tick rate", () => {
        const tickDamage = calculateNalaSerpentDotTickDamage(24, 60)
        const ticks = NALA_SERPENT_DOT_DURATION_MS / NALA_SERPENT_DOT_TICK_RATE_MS

        expect(calculateNalaSerpentDotTotalRawDamage(24, 60)).toBeCloseTo(tickDamage * ticks)
    })

    it("keeps total raw damage aligned with impact plus dot", () => {
        const attackDamage = 30
        const abilityPower = 75

        expect(calculateNalaSerpentTotalRawDamage(attackDamage, abilityPower)).toBeCloseTo(
            calculateNalaSerpentImpactDamage(attackDamage, abilityPower) + calculateNalaSerpentDotTotalRawDamage(attackDamage, abilityPower)
        )
    })
})
