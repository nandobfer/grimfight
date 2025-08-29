import { Character } from "../../creature/character/Character"
import { Statikk } from "../../creature/classes/Statikk"
import { Trait } from "./Trait"

type TraitBoosts = "attackSpeedMultiplier" | "maxStacks"

export class SpeedyTrait extends Trait {
    name = "Ligeiro"
    description = "ligeiros ganham {0} a cada ataque, até um máximo de {1}."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { attackSpeedMultiplier: 0.01, maxStacks: 100, descriptionParams: ["1%%", "100%"] }],
        [3, { attackSpeedMultiplier: 0.02, maxStacks: 200, descriptionParams: ["2%", "200%"] }],
    ])

    private baseline = new WeakMap<Character, number>()

    private stacks = new WeakMap<Character, number>()

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        if (!this.stacks.has(character)) this.stacks.set(character, 0)
        const previousHandler = character.eventHandlers.speedyTrait

        if (previousHandler) {
            character.off("afterAttack", previousHandler)
        }

        const handler = () => {
            const values = this.stages.get(this.activeStage)
            if (!values) return

            // capture baseline once (includes augments!)
            if (!this.baseline.has(character)) {
                const base0 =
                    character instanceof Statikk
                        ? character.bonusAttackSpeed || character.attackSpeed // fallback safety
                        : character.attackSpeed
                this.baseline.set(character, base0)
            }
            const base = this.baseline.get(character)!

            let stacks = this.stacks.get(character) ?? 0
            if (stacks < values.maxStacks) {
                stacks += 1
                this.stacks.set(character, stacks)
            }

            const multiplier = 1 + stacks * values.attackSpeedMultiplier
            character.attackSpeed = base * multiplier

            if (character instanceof Statikk) {
                character.bonusAttackSpeed = base * multiplier
            }
        }

        character.eventHandlers.speedyTrait = handler

        character.on("afterAttack", handler)
        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character) {
        const handler = character.eventHandlers.speedyTrait
        if (handler) {
            character.off("afterAttack", handler)
            delete character.eventHandlers.speedyTrait
        }
        this.stacks.delete(character)
        this.baseline.delete(character)
    }
}
