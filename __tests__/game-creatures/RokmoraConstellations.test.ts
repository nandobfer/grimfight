import { describe, expect, it } from "vitest"
import {
    calculateRokmoraArcherDamage,
    calculateRokmoraChaliceHealingPerAlly,
    calculateRokmoraChaliceHealingPool,
    calculateRokmoraDragonShield,
    getNextRokmoraConstellation,
} from "../../src/game/creature/classes/RokmoraConstellations"

describe("Rokmora constellations", () => {
    it("cycles through archer, dragon, and chalice", () => {
        expect(getNextRokmoraConstellation("archer")).toBe("dragon")
        expect(getNextRokmoraConstellation("dragon")).toBe("chalice")
        expect(getNextRokmoraConstellation("chalice")).toBe("archer")
    })

    it("calculates archer damage from max health and AP", () => {
        expect(calculateRokmoraArcherDamage(1000, 120)).toBe(340)
    })

    it("calculates dragon shield from damage taken and armor", () => {
        expect(calculateRokmoraDragonShield(200, 50)).toBe(100)
    })

    it("does not create negative dragon shield with negative armor", () => {
        expect(calculateRokmoraDragonShield(200, -25)).toBe(0)
    })

    it("splits chalice healing between wounded allies", () => {
        expect(calculateRokmoraChaliceHealingPool(1000)).toBe(200)
        expect(calculateRokmoraChaliceHealingPerAlly(1000, 1)).toBe(200)
        expect(calculateRokmoraChaliceHealingPerAlly(1000, 2)).toBe(100)
    })

    it("returns zero chalice healing when no ally is wounded", () => {
        expect(calculateRokmoraChaliceHealingPerAlly(1000, 0)).toBe(0)
    })
})
