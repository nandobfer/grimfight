import { CreatureGroup } from "../../creature/CreatureGroup"
import { Augment } from "./Augment"

export class BonusGoldAugment extends Augment {
    constructor() {
        const name = "bonusgold"
        const description = "you gain your floor in gold"
        super(name, description)
    }

    override onPick(team: CreatureGroup): void {
        team.scene.changePlayerGold(team.scene.playerGold + team.scene.floor)
    }
}
