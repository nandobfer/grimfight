import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class CasterAugment extends Augment {
    constructor() {
        const name = "caster"
        const description = "increases mana regen per second by 2"
        super(name, description)
    }

    override applyModifier(creature: Creature): void {
        creature.manaPerSecond += 2
    }
}
