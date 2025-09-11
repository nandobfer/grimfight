import { Character } from "../../creature/character/Character"
import { Trait } from "./Trait"

type TraitBoosts = "healthMultiplier" | "armor"

export class ColossusTrait extends Trait {
    name = "Colosso"
    description = "Colossos ganham {0} vida e {1} armadura."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { healthMultiplier: 0.15, armor: 15, descriptionParams: ["15%", "15%"] }],
        [4, { healthMultiplier: 0.35, armor: 25, descriptionParams: ["35%", "25%"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        character.maxHealth *= 1 + values.healthMultiplier
        character.health *= 1 + values.healthMultiplier
        character.armor += values.armor
    }
}
