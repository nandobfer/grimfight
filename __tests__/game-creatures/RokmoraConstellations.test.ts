import { describe, expect, it } from "vitest"
import {
    calculateRokmoraArcherDamage,
    calculateRokmoraChaliceHealingPerAlly,
    calculateRokmoraChaliceHealingPool,
    calculateRokmoraDragonShield,
    getNextRokmoraConstellation,
    ROKMORA_ARCHER_STAR_DELAY_MS,
} from "../../src/game/creature/classes/RokmoraConstellations"

describe("Rokmora constellations", () => {
    it("cycles through archer, dragon, and chalice", () => {
        expect(getNextRokmoraConstellation("archer")).toBe("dragon")
        expect(getNextRokmoraConstellation("dragon")).toBe("chalice")
        expect(getNextRokmoraConstellation("chalice")).toBe("archer")
    })

    it("calculates archer damage from max health and AP", () => {
        const damage = calculateRokmoraArcherDamage(1000, 120)

        expect(Number.isFinite(damage)).toBe(true)
        expect(damage).toBeGreaterThanOrEqual(0)
    })

    it("exposes a finite archer star launch delay", () => {
        expect(Number.isFinite(ROKMORA_ARCHER_STAR_DELAY_MS)).toBe(true)
        expect(ROKMORA_ARCHER_STAR_DELAY_MS).toBeGreaterThan(0)
    })

    it("calculates dragon shield from incoming pre-mitigation damage and armor", () => {
        const incomingDamage = 200
        const shield = calculateRokmoraDragonShield(incomingDamage, 50)

        expect(Number.isFinite(shield)).toBe(true)
        expect(shield).toBeGreaterThanOrEqual(0)
    })

    it("does not create negative dragon shield with negative armor", () => {
        expect(calculateRokmoraDragonShield(200, -25)).toBe(0)
    })

    it("splits chalice healing between wounded allies", () => {
        const maxHealth = 1000
        const pool = calculateRokmoraChaliceHealingPool(maxHealth)

        expect(Number.isFinite(pool)).toBe(true)
        expect(pool).toBeGreaterThanOrEqual(0)
        expect(calculateRokmoraChaliceHealingPerAlly(maxHealth, 1)).toBe(pool)
        expect(calculateRokmoraChaliceHealingPerAlly(maxHealth, 2)).toBe(pool / 2)
    })

    it("returns zero chalice healing when no ally is wounded", () => {
        expect(calculateRokmoraChaliceHealingPerAlly(1000, 0)).toBe(0)
    })
})
