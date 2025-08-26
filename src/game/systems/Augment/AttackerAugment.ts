import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class AttackerAugment extends Augment {
    constructor() {
        const name = "attacker"
        super(name)
        this.values.boost = Phaser.Math.FloatBetween(0.1, 0.3)
        this.descriptionValues = { boost: { value: Math.round(this.values.boost * 100), color: "error.main" } }
        this.description = `increases attack damage by [boost:${this.descriptionValues.boost.value}%]`
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage *= 1 + this.values.boost
    }
}
