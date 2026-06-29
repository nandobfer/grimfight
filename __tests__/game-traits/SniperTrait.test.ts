import { describe, expect, it } from "vitest"
import { calculateThresholdProtectedDamage } from "../../src/game/systems/Combat/ThresholdSurvivalFormulas"
import { SniperTrait } from "../../src/game/systems/Traits/SniperTrait"
import { calculateSniperDamageMultiplier, calculateSniperGridDistance } from "../../src/game/systems/Traits/formulas/SniperTraitFormulas"

describe("Sniper trait formulas", () => {
    it("defines two active damage stages and description params", () => {
        const trait = new SniperTrait(["laherce", "nala", "reno", "freud"])

        expect(trait.name).toBe("Sniper")
        expect(trait.maxStage).toBe(Math.max(...trait.stages.keys()))
        for (const stage of trait.stages.values()) {
            expect(stage.damageMultiplierPerGrid).toBeGreaterThan(0)
            expect(stage.untargetableThreshold).toBeGreaterThan(0)
            expect(stage.untargetableDuration).toBeGreaterThan(0)
            expect(stage.descriptionParams).toHaveLength(2)
        }
    })

    it("uses grid distance between attacker and target cells", () => {
        expect(calculateSniperGridDistance({ col: 1, row: 5 }, { col: 4, row: 3 })).toBe(3)
        expect(calculateSniperGridDistance({ col: 4, row: 3 }, { col: 4, row: 3 })).toBe(0)
    })

    it("scales damage by distance and clamps invalid inputs", () => {
        expect(calculateSniperDamageMultiplier(3, 0.1)).toBeCloseTo(0.3)
        expect(calculateSniperDamageMultiplier(-1, 0.1)).toBe(0)
        expect(calculateSniperDamageMultiplier(3, -0.1)).toBe(0)
    })

    it("caps incoming damage at the survival threshold before the first trigger", () => {
        const protectedDamage = calculateThresholdProtectedDamage({
            currentHealth: 100,
            maxHealth: 100,
            shield: 0,
            armor: 0,
            damage: 1000,
            damageType: "normal",
            threshold: 0.6,
            alreadyTriggered: false,
        })

        expect(protectedDamage).toBe(40)
    })

    it("accounts for shield and mitigation when capping threshold damage", () => {
        const protectedDamage = calculateThresholdProtectedDamage({
            currentHealth: 100,
            maxHealth: 100,
            shield: 10,
            armor: 50,
            damage: 1000,
            damageType: "normal",
            threshold: 0.6,
            alreadyTriggered: false,
        })

        expect(protectedDamage).toBe(100)
    })

    it("does not cap damage after the threshold effect has triggered", () => {
        const damage = calculateThresholdProtectedDamage({
            currentHealth: 100,
            maxHealth: 100,
            shield: 0,
            armor: 0,
            damage: 1000,
            damageType: "normal",
            threshold: 0.6,
            alreadyTriggered: true,
        })

        expect(damage).toBe(1000)
    })
})
