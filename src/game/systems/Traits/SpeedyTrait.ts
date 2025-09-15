import { Character } from "../../creature/character/Character"
import { Trait } from "./Trait"

type TraitBoosts = "attackSpeedMultiplier"

export class SpeedyTrait extends Trait {
    name = "Swift"
    description = "Swift units gain {0} attack speed."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { attackSpeedMultiplier: 0.3, descriptionParams: ["30%"] }],
        [4, { attackSpeedMultiplier: 0.5, descriptionParams: ["50%"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        character.attackSpeed += character.baseAttackSpeed * values.attackSpeedMultiplier
    }
}
