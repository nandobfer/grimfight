import { describe, expect, it, vi } from "vitest"
import type { Creature } from "../../src/game/creature/Creature"
import { Dot } from "../../src/game/objects/StatusEffect/Dot"

function createDotDoubles() {
    const target = {
        takeDamage: vi.fn(),
        statusEffects: new Set(),
        once: vi.fn(),
        off: vi.fn(),
    } as unknown as Creature

    const user = {
        calculateDamage: vi.fn((damage: number) => ({ value: damage, crit: false })),
    } as unknown as Creature

    return { target, user }
}

describe("Dot", () => {
    it("emits damage events by default", () => {
        const { target, user } = createDotDoubles()
        const dot = new Dot({ abilityName: "Poison", damageType: "poison", duration: 1000, target, tickDamage: 10, tickRate: 100, user })

        dot.tick()

        expect(target.takeDamage).toHaveBeenCalledWith(10, user, "poison", false, true, "Poison")
    })

    it("can suppress damage events for passive burns", () => {
        const { target, user } = createDotDoubles()
        const dot = new Dot({
            abilityName: "Morellonomicon",
            damageType: "fire",
            duration: 1000,
            emitDamageEvents: false,
            target,
            tickDamage: 10,
            tickRate: 100,
            user,
        })

        dot.tick()

        expect(target.takeDamage).toHaveBeenCalledWith(10, user, "fire", false, false, "Morellonomicon")
    })
})
