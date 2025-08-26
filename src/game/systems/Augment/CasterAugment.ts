import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class CasterAugment extends Augment {
    constructor() {
        const name = "caster"
        super(name)
        this.values.boost = Phaser.Math.FloatBetween(0.1, 0.3)
        this.descriptionValues.boost = { value: Math.round(this.values.boost * 100), color: "info.main" }
        this.description = `increases mana regen per second by [boost:${this.descriptionValues.boost.value}%]`
        this.color = "info"
    }

    override applyModifier(creature: Creature): void {
        creature.manaPerSecond *= 1 + this.values.boost
    }
}
