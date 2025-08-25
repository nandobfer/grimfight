import { Creature } from "../../creature/Creature"

export class Augment {
    name: string
    description: string
    chosenFloor = 0

    constructor(name: string, description: string) {
        this.name = name
        this.description = description
    }

    // each augment must override
    applyModifier(creature: Creature) {}

    // each augment must override
    onPick() {}
}