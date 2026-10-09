import { describe, expect, it } from "vitest"
import {
    EDNO_DIE_FACES,
    EDNO_SHIELD_HP_RATIO,
    ednoShieldCount,
    ednoShieldGrant,
} from "../../src/game/creature/classes/EdnoAegis"

describe("Edno spectral aegis shield count", () => {
    it("conjures one shield per pip of the fate die", () => {
        for (let roll = 1; roll <= EDNO_DIE_FACES; roll++) {
            expect(ednoShieldCount(roll)).toBe(roll)
        }
    })

    it("never conjures a negative number of shields", () => {
        expect(ednoShieldCount(0)).toBe(0)
        expect(ednoShieldCount(-3)).toBe(0)
    })
})

describe("Edno spectral aegis shield grant", () => {
    it("scales with maximum health and the rolled value", () => {
        const maxHealth = 1000
        expect(ednoShieldGrant(maxHealth, 1)).toBeCloseTo(maxHealth * EDNO_SHIELD_HP_RATIO)
        expect(ednoShieldGrant(maxHealth, 3)).toBeCloseTo(3 * maxHealth * EDNO_SHIELD_HP_RATIO)
        expect(ednoShieldGrant(maxHealth, 3)).toBeGreaterThan(ednoShieldGrant(maxHealth, 2))
    })

    it("is proportional: doubling maximum health doubles the granted shield", () => {
        expect(ednoShieldGrant(800, EDNO_DIE_FACES)).toBeCloseTo(ednoShieldGrant(400, EDNO_DIE_FACES) * 2)
    })

    it("is zero without a valid roll", () => {
        expect(ednoShieldGrant(1000, 0)).toBe(0)
        expect(ednoShieldGrant(1000, -5)).toBe(0)
    })

    it("always returns a finite, non-negative shield", () => {
        for (let roll = -2; roll <= EDNO_DIE_FACES + 2; roll++) {
            const value = ednoShieldGrant(1000, roll)
            expect(Number.isFinite(value)).toBe(true)
            expect(value).toBeGreaterThanOrEqual(0)
        }
    })
})
