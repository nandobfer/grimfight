import type { Character } from "../../creature/character/Character"
import { Trait } from "./Trait"

type DestinyStage = {
    rolls: number
    descriptionParams: string[]
}

export class DestinyTrait extends Trait {
    name = "Destiny"
    description = "Lança o dado do destino {0} vezes e mantém o maior resultado."
    stages: Map<number, DestinyStage> = new Map([
        [2, { rolls: 2, descriptionParams: ["2"] }],
        [3, { rolls: 3, descriptionParams: ["3"] }],
        [4, { rolls: 4, descriptionParams: ["4"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        character.destinyRolls = values.rolls
        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character): void {
        character.destinyRolls = 1
    }
}
