import { CreatureGroup } from "../../creature/CreatureGroup"
import { Augment } from "./Augment"

export class BonusHealthAugment extends Augment {
    constructor() {
        const name = "bonushealth"
        super(name)
        this.values.boost = 3
        this.descriptionValues.boost = { color: "error.main", value: this.values.boost }
        this.description = `you gain [bonus:${this.values.boost} health]`
        this.color = "default"
    }

    override onPick(team: CreatureGroup): void {
        team.scene.changePlayerLives(team.scene.playerLives + this.values.boost)
    }
}
