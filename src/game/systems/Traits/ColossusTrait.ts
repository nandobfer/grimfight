import { Character } from "../../creature/character/Character"
import { Trait } from "./Trait"

type TraitBoosts = "healthMultiplier" | "armor"

export class ColossusTrait extends Trait {
    name = "Colossi"
    description = "Colossi gain {0} health and {1} armor."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { healthMultiplier: 0.15, armor: 15, descriptionParams: ["15%", "15%"] }],
        [4, { healthMultiplier: 0.35, armor: 20, descriptionParams: ["35%", "20%"] }],
				[6, { healthMultiplier: 0.50, armor: 25, descriptionParams: ["50%", "25%"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        character.maxHealth += character.baseMaxHealth * values.healthMultiplier
        character.health += character.baseMaxHealth * values.healthMultiplier
        character.armor += values.armor
    }
}
