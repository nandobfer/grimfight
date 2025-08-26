import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class AttackerAugment extends Augment {
    constructor() {
        const name = "attacker"
        const description = "increases attack damage by 20%"
        super(name, description)
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage *= 1.2
    }
}
