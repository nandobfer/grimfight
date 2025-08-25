import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class PowerfulAugment extends Augment {
    constructor() {
        const name = "powerful"
        const description = "increases ability power by 20%"
        super(name, description)
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower *= 1.2
    }
}
