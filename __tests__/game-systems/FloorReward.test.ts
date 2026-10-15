import { describe, expect, it } from "vitest"
import {
    calculateFastVictoryGoldBonus,
    calculateFloorVictoryGold,
    calculateFloorVictoryReward,
    fastVictoryGoldBonusRatio,
    floorRewardBaseGold,
    floorRewardGoldPerFloor,
} from "../../src/game/creature/character/floorReward"

describe("floor victory gold", () => {
    it("scales the base gold with the floor from the exported configuration", () => {
        for (const floor of [1, 2, 3, 5, 10, 25]) {
            const expected = floorRewardBaseGold + Math.round(floor * floorRewardGoldPerFloor)
            expect(calculateFloorVictoryGold(floor)).toBe(expected)
        }
    })

    it("is finite and non-negative for representative floors", () => {
        for (const floor of [1, 4, 9, 20]) {
            const gold = calculateFloorVictoryGold(floor)
            expect(Number.isFinite(gold)).toBe(true)
            expect(gold).toBeGreaterThanOrEqual(0)
        }
    })
})

describe("fast victory gold bonus", () => {
    it("rounds the bonus up so a fast victory always rewards something", () => {
        const baseGold = calculateFloorVictoryGold(1)
        const bonus = calculateFastVictoryGoldBonus(baseGold)

        expect(bonus).toBe(Math.ceil(baseGold * fastVictoryGoldBonusRatio))
        expect(bonus).toBeGreaterThan(0)
    })

    it("respects a custom bonus ratio", () => {
        expect(calculateFastVictoryGoldBonus(10, 0.5)).toBe(5)
        expect(calculateFastVictoryGoldBonus(3, 0.5)).toBe(2)
    })

    it("grants nothing for zero or invalid base gold", () => {
        expect(calculateFastVictoryGoldBonus(0)).toBe(0)
        expect(calculateFastVictoryGoldBonus(-5)).toBe(0)
        expect(calculateFastVictoryGoldBonus(Number.NaN)).toBe(0)
    })
})

describe("floor victory reward", () => {
    it("does not grant a bonus for a regular victory", () => {
        const reward = calculateFloorVictoryReward(7, false)

        expect(reward.baseGold).toBe(calculateFloorVictoryGold(7))
        expect(reward.bonusGold).toBe(0)
        expect(reward.totalGold).toBe(reward.baseGold)
    })

    it("adds the fast victory bonus on top of the base gold", () => {
        const reward = calculateFloorVictoryReward(7, true)

        expect(reward.baseGold).toBe(calculateFloorVictoryGold(7))
        expect(reward.bonusGold).toBeGreaterThan(0)
        expect(reward.totalGold).toBe(reward.baseGold + reward.bonusGold)
    })

    it("never pays less than the base gold", () => {
        for (const floor of [1, 6, 12]) {
            expect(calculateFloorVictoryReward(floor, true).totalGold).toBeGreaterThanOrEqual(calculateFloorVictoryReward(floor, false).totalGold)
        }
    })
})
