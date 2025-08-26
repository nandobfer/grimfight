import { CreatureGroup } from "../../creature/CreatureGroup"
import { Augment } from "./Augment"

export class BonusHealthAugment extends Augment {
    constructor() {
        const name = "bonushealth"
        super(name)
        this.values.boost = Phaser.Math.RND.weightedPick([1, 1, 2])
        this.descriptionValues.boost = { color: "error.main", value: this.values.boost }
        this.description = `you gain [bonus:1 health]`
    }

    override onPick(team: CreatureGroup): void {
        team.scene.changePlayerLives(team.scene.playerLives + this.values.boost)
    }
}
