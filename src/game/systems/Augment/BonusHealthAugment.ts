import { CreatureGroup } from "../../creature/CreatureGroup"
import { Augment } from "./Augment"

export class BonusHealthAugment extends Augment {
    constructor() {
        const name = "bonushealth"
        const description = "you gain 1 health"
        super(name, description)
    }

    override onPick(team: CreatureGroup): void {
        team.scene.changePlayerLives(team.scene.playerLives + 1)
    }
}
