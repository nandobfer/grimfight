import { CreatureGroup } from "../../creature/CreatureGroup"
import { Augment } from "./Augment"

export class BonusGoldAugment extends Augment {
    constructor() {
        const name = "bonusgold"
        super(name)
        this.descriptionValues.gold = { value: "floor", color: "warning.main" }
        this.description = `you gain your floor in [gold:gold]`
        this.color = "default"
    }

    override onPick(team: CreatureGroup): void {
        const gold = team.scene.playerGold + team.scene.floor
        team.scene.changePlayerGold(gold)
        team.scene.goldCoinFx.explodeCameraCenterToCounter(gold)
    }
}
