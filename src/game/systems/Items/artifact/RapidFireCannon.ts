import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class RapidFireCannon extends Item {
    key = "rapidfirecannon"
    name = "Rapid Fire Cannon"
    descriptionLines = ["+50% AS", "Passive: Infinite attack range."]

    constructor(scene: Game) {
        super(scene, "item-rapidfirecannon")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatPercent("attackSpeed", 50)
        creature.attackRange = Infinity
    }
}
