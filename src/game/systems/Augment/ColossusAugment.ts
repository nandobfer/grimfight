import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class ColossusAugment extends Augment {
    constructor() {
        const name = "colossus"
        super(name)
        this.values.boost = Phaser.Math.FloatBetween(0.1, 0.3)
        this.descriptionValues.boost = { value: Math.round(this.values.boost * 100), color: "success.main" }
        this.description = `characters that start the round in the first row are [boost:${this.descriptionValues.boost.value}%] bigger and have [boost:${this.descriptionValues.boost.value}%] more health`
        this.color = "success"
    }

    override applyModifier(creature: Creature): void {
        if (creature.getPlacement() === "front") {
            creature.maxHealth *= 1 + this.values.boost
            creature.setScale(creature.scale * (1 + this.values.boost))
        }
    }
}
