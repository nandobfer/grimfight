import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class DexterousAugment extends Augment {
    constructor() {
        const name = "dexterous"
        super(name)
        this.values.boost = Phaser.Math.FloatBetween(0.05, 0.1)
        this.descriptionValues.boost = { value: Math.round(this.values.boost * 100), color: "primary.main" }
        this.description = `increases attack speed by [boost:${this.descriptionValues.boost.value}%]`
        this.color = "warning"
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed *= 1.2
    }
}
