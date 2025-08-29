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

    private stacks = new WeakMap<Character, number>()
    private handlers = new WeakMap<Character, () => void>()

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        if (!this.stacks.has(character)) this.stacks.set(character, 0)
        if (this.handlers.has(character)) return // avoid duplicate listeners

        const handler = () => {
            const values = this.stages.get(this.activeStage)
            if (!values) return

            let stacks = this.stacks.get(character) ?? 0
            if (stacks < values.maxStacks) {
                stacks += 1
                this.stacks.set(character, stacks)
            }

            const multiplier = 1 + stacks * values.attackSpeedMultiplier
            character.attackSpeed = character.baseAttackSpeed * multiplier

            if (character instanceof Statikk) {
                character.bonusAttackSpeed = character.baseAttackSpeed * multiplier
            }
        }

        this.handlers.set(character, handler)
        character.on("afterAttack", handler)
        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character) {
        const handlers = this.handlers.get(character)
        if (handlers) {
            character.off("afterAttack", handlers)
            this.handlers.delete(character)
        }
        this.stacks.delete(character)
    }
}
