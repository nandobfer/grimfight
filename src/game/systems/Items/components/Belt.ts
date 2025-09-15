import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Belt extends Item {
    key = "belt"
    name = "Belt"
    descriptionLines = ["+10% max health"]

    constructor(scene: Game) {
        super(scene, "item-belt")
    }

    override applyModifier(creature: Creature): void {
        creature.maxHealth += creature.baseMaxHealth * 0.1
    }
}
