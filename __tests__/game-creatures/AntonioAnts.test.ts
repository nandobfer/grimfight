import { describe, expect, it } from "vitest"
import {
    ANTONIO_ANT_DURATION_MS,
    ANTONIO_ANT_TICK_RATE_MS,
    ANTONIO_EGG_PER_NORMAL_HIT,
    calculateAntonioAntTickDamage,
    calculateAntonioEggsPerHit,
    calculateAntonioHealPerEgg,
    countAntonioAnts,
} from "../../src/game/creature/classes/AntonioAnts"

describe("Antonio ants", () => {
    it("injects the base number of eggs on a normal hit", () => {
        expect(calculateAntonioEggsPerHit(false, 2)).toBe(ANTONIO_EGG_PER_NORMAL_HIT)
    })

    it("injects floor(crit multiplier) eggs on a crit, never fewer than a normal hit", () => {
        expect(calculateAntonioEggsPerHit(true, 2)).toBe(Math.floor(2))
        expect(calculateAntonioEggsPerHit(true, 3.7)).toBe(Math.floor(3.7))
        expect(calculateAntonioEggsPerHit(true, 1.4)).toBeGreaterThanOrEqual(ANTONIO_EGG_PER_NORMAL_HIT)
        expect(calculateAntonioEggsPerHit(true, -5)).toBe(ANTONIO_EGG_PER_NORMAL_HIT)
    })

    it("scales ant tick damage hybridly and ignores invalid input", () => {
        const base = calculateAntonioAntTickDamage(80, 120)

        expect(Number.isFinite(base)).toBe(true)
        expect(calculateAntonioAntTickDamage(160, 120)).toBeGreaterThan(base)
        expect(calculateAntonioAntTickDamage(80, 240)).toBeGreaterThan(base)
        expect(calculateAntonioAntTickDamage(-1, -1)).toBe(0)
    })

    it("derives heal per egg from max health and egg count", () => {
        const single = calculateAntonioHealPerEgg(1000, 1)

        expect(single).toBeGreaterThan(0)
        expect(calculateAntonioHealPerEgg(1000, 3)).toBeCloseTo(single * 3)
        expect(calculateAntonioHealPerEgg(1000, 0)).toBe(0)
        expect(calculateAntonioHealPerEgg(-1000, 3)).toBe(0)
    })

    it("counts one ant per egg without a cap", () => {
        expect(countAntonioAnts(7)).toBe(7)
        expect(countAntonioAnts(0)).toBe(0)
        expect(countAntonioAnts(-3)).toBe(0)
        expect(countAntonioAnts(2.9)).toBe(2)
    })

    it("exposes positive finite timing constants", () => {
        for (const value of [ANTONIO_ANT_DURATION_MS, ANTONIO_ANT_TICK_RATE_MS]) {
            expect(Number.isFinite(value)).toBe(true)
            expect(value).toBeGreaterThan(0)
        }
    })
})
