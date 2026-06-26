import { describe, expect, it } from "vitest"

import {
    calculateSilviaBonusAbilityPower,
    calculateSilviaBonusMaxHealth,
    calculateSilviaChainDamage,
    calculateSilviaPassiveBonuses,
    getSilviaChainPoint,
    getSilviaPullDestination,
    SILVIA_CHAIN_DAMAGE_AP_RATIO,
    SILVIA_PASSIVE_AP_FROM_HEALTH_RATIO,
    SILVIA_PASSIVE_HEALTH_FROM_AP_RATIO,
} from "../../src/game/creature/classes/SilviaChains"

describe("Silvia chain formulas", () => {
    it("keeps passive bonuses finite, non-negative, and snapshot-based", () => {
        const abilityPower = 80
        const maxHealth = 600
        const bonuses = calculateSilviaPassiveBonuses(abilityPower, maxHealth)

        expect(Number.isFinite(bonuses.maxHealthBonus)).toBe(true)
        expect(Number.isFinite(bonuses.abilityPowerBonus)).toBe(true)
        expect(bonuses.maxHealthBonus).toBeGreaterThanOrEqual(0)
        expect(bonuses.abilityPowerBonus).toBeGreaterThanOrEqual(0)
        expect(bonuses.maxHealthBonus).toBe(calculateSilviaBonusMaxHealth(abilityPower))
        expect(bonuses.abilityPowerBonus).toBe(calculateSilviaBonusAbilityPower(maxHealth))
        expect(bonuses.abilityPowerBonus).not.toBe(calculateSilviaBonusAbilityPower(maxHealth + bonuses.maxHealthBonus))
    })

    it("derives passive bonuses from the current configured ratios", () => {
        const abilityPower = 40
        const maxHealth = 500

        expect(calculateSilviaBonusMaxHealth(abilityPower)).toBeCloseTo(abilityPower * SILVIA_PASSIVE_HEALTH_FROM_AP_RATIO)
        expect(calculateSilviaBonusAbilityPower(maxHealth)).toBeCloseTo(maxHealth * SILVIA_PASSIVE_AP_FROM_HEALTH_RATIO)
    })

    it("scales chain damage with ability power and multiplier", () => {
        const lowAp = 50
        const highAp = 100
        const baseDamage = calculateSilviaChainDamage(lowAp)

        expect(calculateSilviaChainDamage(highAp)).toBeGreaterThan(baseDamage)
        expect(calculateSilviaChainDamage(lowAp, 2)).toBeCloseTo(baseDamage * 2)
        expect(calculateSilviaChainDamage(lowAp)).toBeCloseTo(lowAp * SILVIA_CHAIN_DAMAGE_AP_RATIO)
        expect(calculateSilviaChainDamage(-10)).toBe(0)
    })

    it("places the pull destination in front of Silvia toward the target", () => {
        const origin = { x: 100, y: 100 }
        const target = { x: 160, y: 100 }
        const destination = getSilviaPullDestination(origin, target, "down", 40)

        expect(destination.x).toBeCloseTo(140)
        expect(destination.y).toBeCloseTo(100)
    })

    it("uses facing as pull fallback when target overlaps Silvia", () => {
        const origin = { x: 100, y: 100 }
        const destination = getSilviaPullDestination(origin, origin, "up", 40)

        expect(destination.x).toBeCloseTo(100)
        expect(destination.y).toBeCloseTo(60)
    })

    it("builds an arcing chain path between start and end", () => {
        const start = { x: 0, y: 0 }
        const end = { x: 100, y: 0 }
        const midpoint = getSilviaChainPoint(start, end, 0.5, 40)

        expect(midpoint.x).toBeCloseTo(50)
        expect(midpoint.y).not.toBeCloseTo(0)
        expect(getSilviaChainPoint(start, end, 0, 40)).toEqual(start)
        expect(getSilviaChainPoint(start, end, 1, 40)).toEqual(end)
    })
})
