import { describe, expect, it } from "vitest"
import { calculateRemainingDotDamage } from "../../src/game/objects/StatusEffect/DotDamage"

describe("Dot damage helpers", () => {
    it("returns finite non-negative remaining damage", () => {
        const damage = calculateRemainingDotDamage({
            duration: 1000,
            totalTimePassed: 250,
            tickDamage: 10,
            tickRate: 100,
        })

        expect(Number.isFinite(damage)).toBe(true)
        expect(damage).toBeGreaterThanOrEqual(0)
    })

    it("scales with the remaining duration and reaches zero after expiry", () => {
        const params = { duration: 1000, tickDamage: 10, tickRate: 100 }
        const full = calculateRemainingDotDamage({ ...params, totalTimePassed: 0 })
        const partial = calculateRemainingDotDamage({ ...params, totalTimePassed: 500 })
        const expired = calculateRemainingDotDamage({ ...params, totalTimePassed: 1000 })

        expect(partial).toBe(full / 2)
        expect(expired).toBe(0)
    })

    it("ignores invalid temporal inputs", () => {
        expect(calculateRemainingDotDamage({ duration: 1000, totalTimePassed: 0, tickDamage: 10, tickRate: 0 })).toBe(0)
        expect(calculateRemainingDotDamage({ duration: 0, totalTimePassed: 0, tickDamage: 10, tickRate: 100 })).toBe(0)
        expect(calculateRemainingDotDamage({ duration: 1000, totalTimePassed: 0, tickDamage: 0, tickRate: 100 })).toBe(0)
    })
})
