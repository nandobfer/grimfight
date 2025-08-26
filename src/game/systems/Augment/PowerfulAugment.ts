import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class PowerfulAugment extends Augment {
    constructor() {
        const name = "powerful"
        super(name)
        this.values.boost = Phaser.Math.FloatBetween(0.1, 0.3)
        this.descriptionValues.boost = { value: Math.round(this.values.boost * 100), color: "info.main" }
        this.description = `increases ability power by [boost:${this.descriptionValues.boost.value}%]`
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower *= 1 + this.values.boost
    }
}
