import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class CriticalAugment extends Augment {
    constructor() {
        const name = "critical"
        super(name)
        this.values.boost = Phaser.Math.Between(1, 5)
        this.descriptionValues = { boost: { value: Math.round(this.values.boost), color: "error.main" } }
        this.description = `increases critical strike chance by [boost:${this.descriptionValues.boost.value}%]`
        this.color = "error"
    }

    override applyModifier(creature: Creature): void {
        creature.critChance += this.values.boost
    }
}
