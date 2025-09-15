import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Rabadon extends Item {
    key = "rabadon"
    name = "Rabadon's Death Cap"
    descriptionLines = ["+50% AP"]

    constructor(scene: Game) {
        super(scene, "item-rabadon")
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower += creature.baseAbilityPower * 0.5
    }
}
