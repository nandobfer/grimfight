import { Character } from "../../creature/character/Character"
import { Trait } from "./Trait"

type TraitBoosts = "attackDamageMultiplier" | "lifesteal"

export class AttackerTrait extends Trait {
    name = "Atacante"
    description = ""
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { attackDamageMultiplier: 0.2, lifesteal: 10 }],
        [4, { attackDamageMultiplier: 0.4, lifesteal: 20 }],
    ])

    constructor(comp: string[]) {
        super(comp)
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        console.log({stage: this.activeStage, values})
        if (!values) return

        character.attackDamage *= 1 + values.attackDamageMultiplier
        character.lifesteal += values.lifesteal
        character.glowTemporarily(0xff0000, 2, 1000)
    }
}

