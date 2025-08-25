import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class BattlemageAugment extends Augment {
    constructor() {
        const name = "battlemage"
        const description = "attacks deal bonus damage based on a percentage of their Ability Power"
        super(name, description)
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage += creature.abilityPower * 0.3
    }
}
