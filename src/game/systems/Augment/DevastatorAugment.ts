import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class DevastatorAugment extends Augment {
    constructor() {
        const name = "devastator"
        super(name)
        this.values.boost = Phaser.Math.FloatBetween(0.1, 0.3)
        this.descriptionValues = { boost: { value: Math.round(this.values.boost * 100), color: "error.main" } }
        this.description = `increases critical damage multiplier in [boost:${this.descriptionValues.boost.value}%]`
        this.color = "error"
    }

    override applyModifier(creature: Creature): void {
        creature.critDamageMultiplier += this.values.boost
    }
}
