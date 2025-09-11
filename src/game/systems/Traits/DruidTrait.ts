import { Character } from "../../creature/character/Character"
import { Trait } from "./Trait"

type TraitBoosts = "healthMultiplier" | "apMultiplier"

export class DruidTrait extends Trait {
    name = "Druid"
    description = "Druidas recebem {0} de vida máxima e {1} de AP para cada druida em campo."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([[1, { healthMultiplier: 0.1, apMultiplier: 0.1, descriptionParams: ["10%", "10%"] }]])

    druidsCount = 0

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        character.maxHealth += character.baseMaxHealth * values.healthMultiplier * this.druidsCount
        character.health += character.baseMaxHealth * values.healthMultiplier * this.druidsCount
        character.abilityPower += character.abilityPower * values.apMultiplier * this.druidsCount
    }

    override startApplying(characters: Character[]): void {
        super.startApplying(characters)

        for (const character of characters) {
            if (this.comp.includes(character.name)) {
                this.druidsCount++
            }
        }
    }
}
