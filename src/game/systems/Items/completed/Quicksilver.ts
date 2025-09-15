import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Quicksilver extends Item {
    key = "quicksilver"
    name = "Quicksilver Band"
    descriptionLines = ["+10% armor", "+15% critical chance", "Passive: Gains hit critical chance equivalent to your armor"]

    constructor(scene: Game) {
        super(scene, "item-quicksilver")
    }

    override applyModifier(creature: Creature): void {
        creature.armor += 10
        creature.critChance += 15

        creature.critChance += creature.armor
    }
}
