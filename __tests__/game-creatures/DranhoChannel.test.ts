import { describe, expect, it } from "vitest"
import {
    calculateDranhoAlliedAverageAp,
    calculateDranhoChannelDamage,
    DRANHO_CHANNEL_SELF_AP_RATIO,
    DRANHO_CHANNEL_TEAM_AP_RATIO,
    DRANHO_CHANNEL_TICK_MS,
} from "../../src/game/creature/classes/DranhoChannel"

describe("Dranho channel", () => {
    it("calculates finite non-negative channel damage", () => {
        const damage = calculateDranhoChannelDamage(120, 90)

        expect(Number.isFinite(damage)).toBe(true)
        expect(damage).toBeGreaterThanOrEqual(0)
    })

    it("scales proportionally with raw multipliers", () => {
        const baseDamage = calculateDranhoChannelDamage(100, 80)
        const amplifiedDamage = calculateDranhoChannelDamage(100, 80, 1.5)

        expect(amplifiedDamage).toBeCloseTo(baseDamage * 1.5)
    })

    it("increases when Dranho ability power increases", () => {
        const lowerDamage = calculateDranhoChannelDamage(80, 100)
        const higherDamage = calculateDranhoChannelDamage(120, 100)

        expect(higherDamage).toBeGreaterThan(lowerDamage)
    })

    it("increases when allied average ability power increases", () => {
        const lowerDamage = calculateDranhoChannelDamage(100, 80)
        const higherDamage = calculateDranhoChannelDamage(100, 120)

        expect(higherDamage).toBeGreaterThan(lowerDamage)
    })

    it("keeps self and allied contributions balanced when their ability power is equal", () => {
        const selfAp = 100
        const alliedAverageAp = 100
        const selfContribution = selfAp * DRANHO_CHANNEL_SELF_AP_RATIO
        const alliedContribution = alliedAverageAp * DRANHO_CHANNEL_TEAM_AP_RATIO

        expect(selfContribution).toBeCloseTo(alliedContribution)
    })

    it("calculates allied average AP without negative contribution", () => {
        expect(calculateDranhoAlliedAverageAp([100, 50, -20])).toBeCloseTo(50)
        expect(calculateDranhoAlliedAverageAp([])).toBe(0)
    })

    it("exposes a positive finite channel tick interval", () => {
        expect(Number.isFinite(DRANHO_CHANNEL_TICK_MS)).toBe(true)
        expect(DRANHO_CHANNEL_TICK_MS).toBeGreaterThan(0)
    })
})
