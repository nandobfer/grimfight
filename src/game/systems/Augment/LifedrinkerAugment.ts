import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class LifedrinkerAugment extends Augment {
    constructor() {
        const name = "lifedrinker"
        const description = "steal enemy's health when dealing damage"
        super(name, description)
    }

    override applyModifier(creature: Creature): void {
        creature.lifesteal += 10
    }
}
