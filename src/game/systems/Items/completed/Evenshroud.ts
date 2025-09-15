import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Evenshroud extends Item {
    key = "evenshroud"
    name = "Evenshroud"
    descriptionLines = ["+15% max health", "+10% armor"]

    constructor(scene: Game) {
        super(scene, "item-evenshroud")
    }

    override applyModifier(creature: Creature): void {
        creature.maxHealth += creature.baseMaxHealth * 0.15
        creature.health += creature.baseMaxHealth * 0.15
        creature.armor += 10
    }
}
