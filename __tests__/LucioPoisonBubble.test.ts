import { describe, expect, it } from "vitest"
import {
    calculateLucioPoisonBubbleTotalApRatio,
    calculateLucioPoisonBubbleTickDamage,
    calculateLucioPoisonBubbleTotalRawDamage,
    LUCIO_POISON_BUBBLE_DURATION_MS,
    LUCIO_POISON_BUBBLE_TICK_RATE_MS,
} from "../src/game/creature/classes/LucioPoisonBubble"

describe("Lucio poison bubble formulas", () => {
    it("returns finite non-negative damage", () => {
        expect(Number.isFinite(calculateLucioPoisonBubbleTickDamage(50))).toBe(true)
        expect(calculateLucioPoisonBubbleTickDamage(-50)).toBe(0)
    })

    it("scales proportionally with ability power and multiplier", () => {
        const base = calculateLucioPoisonBubbleTickDamage(50)

        expect(calculateLucioPoisonBubbleTickDamage(100)).toBeCloseTo(base * 2)
        expect(calculateLucioPoisonBubbleTickDamage(50, 2)).toBeCloseTo(base * 2)
    })

    it("derives total raw damage from duration and tick rate", () => {
        const tickDamage = calculateLucioPoisonBubbleTickDamage(80)
        const ticks = LUCIO_POISON_BUBBLE_DURATION_MS / LUCIO_POISON_BUBBLE_TICK_RATE_MS

        expect(calculateLucioPoisonBubbleTotalRawDamage(80)).toBeCloseTo(tickDamage * ticks)
    })

    it("keeps the displayed AP ratio aligned with total damage", () => {
        const abilityPower = 100

        expect(calculateLucioPoisonBubbleTotalRawDamage(abilityPower)).toBeCloseTo(abilityPower * calculateLucioPoisonBubbleTotalApRatio())
    })
})
