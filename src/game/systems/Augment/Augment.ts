import { Creature } from "../../creature/Creature"
import { CreatureGroup } from "../../creature/CreatureGroup"
import { TokenizedDescription, TokenizedValue } from "../../tools/TokenizedText"

export class Augment {
    name: string
    description: string
    chosenFloor = 0
    values: TokenizedValue = { boost: 0 }
    descriptionValues: TokenizedDescription = { boost: { color: "", value: "" } }

    constructor(name: string, description?: string) {
        this.name = name
        this.description = description || ""
    }

    // each augment must override
    applyModifier(creature: Creature) {}

    // each augment must override
    onPick(team: CreatureGroup) {}
}