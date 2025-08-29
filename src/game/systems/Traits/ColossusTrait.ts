import { Character } from "../../creature/character/Character"
import { Trait } from "./Trait"

type TraitBoosts = "healthMultiplier" | "armor"| 'resistance'

export class ColossusTrait extends Trait {
    name = "Colosso"
    description = "Colossos ganham {0} vida, {1} armadura e {2} de resistencia."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { healthMultiplier: 0.15, armor: 10, resistance: 10, descriptionParams: ["15%", "10", '10%'] }],
        [3, { healthMultiplier: 0.30, armor: 15, resistance: 20, descriptionParams: ["30%", "15", '20%'] }],
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
        character.resistance += values.resistance
    }
}

