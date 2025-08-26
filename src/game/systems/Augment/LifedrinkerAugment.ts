import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class LifedrinkerAugment extends Augment {
    constructor() {
        const name = "lifedrinker"
        super(name)
        this.values.boost = Phaser.Math.Between(5, 20)
        this.descriptionValues.boost = { value: this.values.boost, color: "primary.main" }
        this.description = `increases lifesteal by [boost:${this.descriptionValues.boost.value}%]`
        this.color = "success"
    }

    override applyModifier(creature: Creature): void {
        creature.lifesteal += this.values.boost
    }
}
