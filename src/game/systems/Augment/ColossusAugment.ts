import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class ColossusAugment extends Augment {
    constructor() {
        const name = "colossus"
        const description = "characters that start the round in the first row are bigger and have more health"
        super(name, description)
    }

    override applyModifier(creature: Creature): void {
        if (creature.active) {
            creature.maxHealth *= 1.1
            creature.setScale(creature.scale * 1.25)
        }
    }
}
