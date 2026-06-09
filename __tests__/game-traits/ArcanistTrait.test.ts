import { describe, expect, it, vi } from "vitest"
import type { Character } from "../../src/game/creature/character/Character"
import { ArcanistTrait } from "../../src/game/systems/Traits/ArcanistTrait"

type TimerConfig = {
    callback: () => void
    loop: boolean
    delay: number
}

function namedCharacter(name: string): Character {
    return { name } as Character
}

function timedCharacter(state: "fighting" | "idle" = "fighting") {
    let addedConfig: TimerConfig | undefined
    const timerEvent = { id: "arcanist-timer" } as unknown as Phaser.Time.TimerEvent
    const removedEvents: Phaser.Time.TimerEvent[] = []

    const character = {
        baseAbilityPower: 100,
        abilityPower: 100,
        timeEvents: {},
        scene: {
            state,
            time: {
                addEvent: (config: TimerConfig) => {
                    addedConfig = config
                    return timerEvent
                },
                removeEvent: (event: Phaser.Time.TimerEvent) => {
                    removedEvents.push(event)
                },
            },
        },
        once: vi.fn(),
    } as unknown as Character

    return {
        character,
        get addedConfig() {
            if (!addedConfig) throw new Error("Expected Arcanist timer to be registered")
            return addedConfig
        },
        removedEvents,
        timerEvent,
    }
}

describe("Arcanist trait", () => {
    it("defines AP gain stages and description parameters", () => {
        const trait = new ArcanistTrait(["freud"])

        expect(trait.name).toBe("Arcanist")
        expect(trait.description).toBe("Arcanists gain {0} AP every {1} seconds during combat.")
        expect(trait.maxStage).toBe(4)
        expect(trait.stages.get(2)).toMatchObject({ apMultiplier: 0.05, delay: 5000, descriptionParams: ["5%", "5"] })
        expect(trait.stages.get(4)).toMatchObject({ apMultiplier: 0.05, delay: 2000, descriptionParams: ["5%", "2"] })
    })

    it("activates stage 2 and stage 4 from matching composition counts", () => {
        const trait = new ArcanistTrait(["freud", "second", "third", "fourth"])

        trait.startApplying([namedCharacter("freud"), namedCharacter("second")])
        expect(trait.activeComp).toEqual(new Set(["freud", "second"]))
        expect(trait.activeStage).toBe(2)

        trait.startApplying([namedCharacter("freud"), namedCharacter("second"), namedCharacter("third"), namedCharacter("fourth")])
        expect(trait.activeComp).toEqual(new Set(["freud", "second", "third", "fourth"]))
        expect(trait.activeStage).toBe(4)
    })

    it("adds 5 percent base AP while fighting and removes the timer on cleanup", () => {
        const trait = new ArcanistTrait(["freud", "second"])
        trait.activeStage = 2
        const context = timedCharacter("fighting")

        trait.applyModifier(context.character)

        expect(context.addedConfig.delay).toBe(5000)
        expect(context.addedConfig.loop).toBe(true)
        expect(context.character.timeEvents.arcanistTrait).toBe(context.timerEvent)

        context.addedConfig.callback()
        expect(context.character.abilityPower).toBe(105)

        trait.cleanup(context.character)
        expect(context.removedEvents).toEqual([context.timerEvent])
        expect(context.character.timeEvents.arcanistTrait).toBeUndefined()
    })

    it("does not add AP outside combat", () => {
        const trait = new ArcanistTrait(["freud", "second", "third", "fourth"])
        trait.activeStage = 4
        const context = timedCharacter("idle")

        trait.applyModifier(context.character)

        expect(context.addedConfig.delay).toBe(2000)
        context.addedConfig.callback()
        expect(context.character.abilityPower).toBe(100)
    })
})
