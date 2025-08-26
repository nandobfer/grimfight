import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class DexterousAugment extends Augment {
    constructor() {
        const name = "dexterous"
        const description = "increases attack speed by 20%"
        super(name, description)
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed *= 1.2
    }
}
