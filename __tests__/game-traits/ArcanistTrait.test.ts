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
        const stageKeys = Array.from(trait.stages.keys())

        expect(trait.name).toBe("Arcanist")
        expect(trait.description).toBe("Arcanists gain {0} AP every {1} seconds during combat.")
        expect(trait.maxStage).toBe(Math.max(...stageKeys))

        for (const stage of trait.stages.values()) {
            expect(Number.isFinite(stage.apMultiplier)).toBe(true)
            expect(stage.apMultiplier).toBeGreaterThanOrEqual(0)
            expect(Number.isFinite(stage.delay)).toBe(true)
            expect(stage.delay).toBeGreaterThan(0)
            expect(stage.descriptionParams).toHaveLength(2)
        }
    })

    it("activates stages from matching composition counts", () => {
        const trait = new ArcanistTrait(["freud", "second", "third", "fourth"])
        const stages = Array.from(trait.stages.keys()).sort((a, b) => a - b)
        const firstStage = stages[0]
        const finalStage = stages[stages.length - 1]

        const firstStageCharacters = trait.comp.slice(0, firstStage)
        trait.startApplying(firstStageCharacters.map(namedCharacter))
        expect(trait.activeComp).toEqual(new Set(firstStageCharacters))
        expect(trait.activeStage).toBe(firstStage)

        const finalStageCharacters = trait.comp.slice(0, finalStage)
        trait.startApplying(finalStageCharacters.map(namedCharacter))
        expect(trait.activeComp).toEqual(new Set(finalStageCharacters))
        expect(trait.activeStage).toBe(finalStage)
    })

    it("adds configured base AP while fighting and removes the timer on cleanup", () => {
        const trait = new ArcanistTrait(["freud", "second"])
        const activeStage = Array.from(trait.stages.keys()).sort((a, b) => a - b)[0]
        const stage = trait.stages.get(activeStage)
        if (!stage) throw new Error("Expected Arcanist stage to exist")

        trait.activeStage = activeStage
        const context = timedCharacter("fighting")

        trait.applyModifier(context.character)

        expect(context.addedConfig.delay).toBe(stage.delay)
        expect(context.addedConfig.loop).toBe(true)
        expect(context.character.timeEvents.arcanistTrait).toBe(context.timerEvent)

        context.addedConfig.callback()
        expect(context.character.abilityPower).toBe(100 + 100 * stage.apMultiplier)

        trait.cleanup(context.character)
        expect(context.removedEvents).toEqual([context.timerEvent])
        expect(context.character.timeEvents.arcanistTrait).toBeUndefined()
    })

    it("does not add AP outside combat", () => {
        const trait = new ArcanistTrait(["freud", "second", "third", "fourth"])
        const activeStage = Math.max(...trait.stages.keys())
        const stage = trait.stages.get(activeStage)
        if (!stage) throw new Error("Expected Arcanist stage to exist")

        trait.activeStage = activeStage
        const context = timedCharacter("idle")

        trait.applyModifier(context.character)

        expect(context.addedConfig.delay).toBe(stage.delay)
        context.addedConfig.callback()
        expect(context.character.abilityPower).toBe(100)
    })
})
