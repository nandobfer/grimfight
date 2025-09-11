import { Character } from "../../creature/character/Character"
import { Trait } from "./Trait"

type TraitBoosts = "attackDamageMultiplier" | "lifesteal"

export class AttackerTrait extends Trait {
    name = "Atacante"
    description = "Atacantes ganham {0} dano de ataque e {1} roubo de vida."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { attackDamageMultiplier: 0.2, lifesteal: 10, descriptionParams: ["20%", "10%"] }],
        [4, { attackDamageMultiplier: 0.4, lifesteal: 20, descriptionParams: ["40%", "20%"] }],
        [6, { attackDamageMultiplier: 0.8, lifesteal: 30, descriptionParams: ["80%", "30%"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        character.attackDamage += character.baseAttackDamage * values.attackDamageMultiplier
        character.lifesteal += values.lifesteal
    }
}

