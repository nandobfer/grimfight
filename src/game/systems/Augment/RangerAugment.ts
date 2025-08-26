import { Creature } from "../../creature/Creature"
import { Augment } from "./Augment"

export class RangerAugment extends Augment {
    constructor() {
        const name = "ranger"
        super(name)
        this.values.boost = Phaser.Math.Between(1, 3)
        this.descriptionValues.boost = { value: this.values.boost, color: "primary.main" }
        this.description = `characters that start the round in the last row has [boost:${this.descriptionValues.boost.value}] more attack range`
    }

    override applyModifier(creature: Creature): void {
        if (creature.getPlacement() === "back") {
            creature.attackRange += this.values.boost
        }
    }
}
