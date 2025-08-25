import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class RangerAugment extends Augment {
    constructor() {
        const name = "ranger"
        const description = "characters that start the round in the last row has double attack range"
        super(name, description)
    }

    override applyModifier(creature: Creature): void {
        if (creature.getPlacement() === "back") {
            creature.attackRange *= 2
        }
    }
}
