import { describe, expect, it } from "vitest"
import {
    iagoDestinyCritBonus,
    iagoEffectiveCritChance,
    iagoRollsWhirlwind,
    iagoWhirlwindDamage,
    iagoWhirlwindProcChance,
    iagoWhirlwindAngle,
    IAGO_WHIRLWIND_AD_RATIO,
    IAGO_WHIRLWIND_AP_RATIO,
    IAGO_WHIRLWIND_DIE_FACES,
} from "../../src/game/creature/classes/IagoDice"

describe("Iago whirlwind trigger", () => {
    it("triggers only on the top face of the die", () => {
        expect(iagoRollsWhirlwind(IAGO_WHIRLWIND_DIE_FACES)).toBe(true)
    })

    it("does not trigger on any other face", () => {
        for (let roll = 1; roll < IAGO_WHIRLWIND_DIE_FACES; roll++) {
            expect(iagoRollsWhirlwind(roll)).toBe(false)
        }
    })
})

describe("Iago whirlwind destiny proc chance", () => {
    it("matches a single die face with a single fate roll", () => {
        expect(iagoWhirlwindProcChance(1)).toBeCloseTo(100 / IAGO_WHIRLWIND_DIE_FACES)
    })

    it("grows with more fate rolls", () => {
        expect(iagoWhirlwindProcChance(2)).toBeGreaterThan(iagoWhirlwindProcChance(1))
        expect(iagoWhirlwindProcChance(4)).toBeGreaterThan(iagoWhirlwindProcChance(2))
    })

    it("stays within a full chance", () => {
        expect(iagoWhirlwindProcChance(100)).toBeLessThanOrEqual(100)
    })
})

describe("Iago whirlwind direction", () => {
    it("points from the caster toward the target", () => {
        expect(iagoWhirlwindAngle(0, 0, 10, 0)).toBeCloseTo(0)
        expect(iagoWhirlwindAngle(0, 0, 0, 10)).toBeCloseTo(Math.PI / 2)
        expect(iagoWhirlwindAngle(0, 0, -10, 0)).toBeCloseTo(Math.PI)
        expect(iagoWhirlwindAngle(0, 0, 0, -10)).toBeCloseTo(-Math.PI / 2)
    })

    it("does not depend on the distance to the target", () => {
        expect(iagoWhirlwindAngle(3, 4, 13, 4)).toBeCloseTo(iagoWhirlwindAngle(3, 4, 103, 4))
    })
})

describe("Iago whirlwind damage", () => {
    it("scales with attack damage and ability power ratios", () => {
        const attackDamage = 30
        const abilityPower = 40

        expect(iagoWhirlwindDamage(attackDamage, 0)).toBeCloseTo(attackDamage * IAGO_WHIRLWIND_AD_RATIO)
        expect(iagoWhirlwindDamage(0, abilityPower)).toBeCloseTo(abilityPower * IAGO_WHIRLWIND_AP_RATIO)
        expect(iagoWhirlwindDamage(attackDamage, abilityPower)).toBeCloseTo(attackDamage * IAGO_WHIRLWIND_AD_RATIO + abilityPower * IAGO_WHIRLWIND_AP_RATIO)
    })

    it("is zero without stats and always finite", () => {
        expect(iagoWhirlwindDamage(0, 0)).toBe(0)
        expect(Number.isFinite(iagoWhirlwindDamage(123.4, 56.7))).toBe(true)
    })

    it("is proportional: doubling both stats doubles the damage", () => {
        const base = iagoWhirlwindDamage(20, 15)
        expect(iagoWhirlwindDamage(40, 30)).toBeCloseTo(base * 2)
    })
})

describe("Iago destiny critical chance", () => {
    it("keeps the base chance with a single fate roll", () => {
        expect(iagoEffectiveCritChance(10, 1)).toBeCloseTo(10)
    })

    it("grows monotonically with more fate rolls", () => {
        const one = iagoEffectiveCritChance(10, 1)
        const two = iagoEffectiveCritChance(10, 2)
        const three = iagoEffectiveCritChance(10, 3)

        expect(two).toBeGreaterThan(one)
        expect(three).toBeGreaterThan(two)
    })

    it("stays within a full chance and respects the base bounds", () => {
        expect(iagoEffectiveCritChance(10, 100)).toBeLessThanOrEqual(100)
        expect(iagoEffectiveCritChance(100, 5)).toBeCloseTo(100)
        expect(iagoEffectiveCritChance(0, 5)).toBe(0)
    })

    it("matches the equivalent chance of keeping the best of independent rolls", () => {
        const baseChance = 25
        const rolls = 3
        const expected = (1 - Math.pow(1 - baseChance / 100, rolls)) * 100

        expect(iagoEffectiveCritChance(baseChance, rolls)).toBeCloseTo(expected)
    })

    it("reports the destiny bonus as the gain over the base chance", () => {
        expect(iagoDestinyCritBonus(10, 1)).toBeCloseTo(0)
        expect(iagoDestinyCritBonus(10, 3)).toBeCloseTo(iagoEffectiveCritChance(10, 3) - 10)
        expect(iagoDestinyCritBonus(10, 3)).toBeGreaterThan(0)
    })
})
