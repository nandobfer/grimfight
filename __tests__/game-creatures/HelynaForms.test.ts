import { describe, expect, it } from "vitest"
import {
    calculateHelynaBearAttackDamage,
    calculateHelynaBearMaxHealth,
    calculateHelynaFrenziedRegenerationHealing,
    calculateHelynaRageFromDamageTaken,
    calculateHelynaRakeTickDamage,
    calculateHelynaRakeTotalDamage,
    calculateHelynaRegrowthHealing,
    calculateHelynaRejuvenationHealing,
    HELYNA_BEAR_ATTACK_DAMAGE_AP_RATIO,
    HELYNA_BEAR_MAX_HEALTH_AP_RATIO,
    HELYNA_FRENZIED_REGENERATION_AP_RATIO,
    HELYNA_FRENZIED_REGENERATION_MAX_HEALTH_RATIO,
    HELYNA_RAGE_MAX,
    HELYNA_RAGE_FULL_DAMAGE_FRACTION,
    HELYNA_RAKE_ATTACK_DAMAGE_RATIO,
    getHelynaRakeTickCount,
    regenerateHelynaEnergy,
    selectHelynaHealingTargets,
} from "../../src/game/creature/classes/HelynaForms"

describe("Helyna form helpers", () => {
    it("fills rage from the configured damage-to-health proportion", () => {
        const maxHealth = 1000
        const rage = calculateHelynaRageFromDamageTaken(maxHealth * HELYNA_RAGE_FULL_DAMAGE_FRACTION, maxHealth)

        expect(rage).toBeCloseTo(HELYNA_RAGE_MAX)
        expect(calculateHelynaRageFromDamageTaken(0, maxHealth)).toBe(0)
        expect(calculateHelynaRageFromDamageTaken(100, 0)).toBe(0)
    })

    it("regenerates energy passively without exceeding its maximum", () => {
        expect(regenerateHelynaEnergy(40, 1000)).toBeGreaterThan(40)
        expect(regenerateHelynaEnergy(98, 1000)).toBe(100)
        expect(regenerateHelynaEnergy(-10, 0)).toBe(0)
    })

    it("derives form stats and healing from current ratios", () => {
        const abilityPower = 80
        const baseMaxHealth = 400
        const baseAttackDamage = 20
        const maxHealth = 900

        expect(calculateHelynaBearMaxHealth(baseMaxHealth, abilityPower)).toBeCloseTo(baseMaxHealth + abilityPower * HELYNA_BEAR_MAX_HEALTH_AP_RATIO)
        expect(calculateHelynaBearAttackDamage(baseAttackDamage, abilityPower)).toBeCloseTo(
            baseAttackDamage + abilityPower * HELYNA_BEAR_ATTACK_DAMAGE_AP_RATIO
        )
        expect(calculateHelynaRegrowthHealing(abilityPower)).toBeGreaterThan(0)
        expect(calculateHelynaRejuvenationHealing(abilityPower)).toBeGreaterThan(calculateHelynaRegrowthHealing(abilityPower))
        expect(calculateHelynaFrenziedRegenerationHealing(abilityPower, maxHealth)).toBeCloseTo(
            abilityPower * HELYNA_FRENZIED_REGENERATION_AP_RATIO + maxHealth * HELYNA_FRENZIED_REGENERATION_MAX_HEALTH_RATIO
        )
    })

    it("splits Rake total damage across the configured bleed ticks", () => {
        const attackDamage = 70
        const total = calculateHelynaRakeTotalDamage(attackDamage)
        const tick = calculateHelynaRakeTickDamage(attackDamage)

        expect(total).toBeCloseTo(attackDamage * HELYNA_RAKE_ATTACK_DAMAGE_RATIO)
        expect(tick * getHelynaRakeTickCount()).toBeCloseTo(total)
    })

    it("prioritizes two different wounded allies when possible and repeats one when needed", () => {
        const healthy = { health: 100, maxHealth: 100, active: true }
        const wounded = { health: 20, maxHealth: 100, active: true }
        const lightlyWounded = { health: 80, maxHealth: 100, active: true }
        const inactive = { health: 1, maxHealth: 100, active: false }

        expect(selectHelynaHealingTargets([healthy, lightlyWounded, wounded, inactive])).toEqual([wounded, lightlyWounded])
        expect(selectHelynaHealingTargets([healthy, wounded])).toEqual([wounded, wounded])
        expect(selectHelynaHealingTargets([healthy])).toEqual([])
    })
})
