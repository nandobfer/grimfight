import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Belt extends Item {
    key = "belt"
    name = "Cintão"
    descriptionLines = ["+10% vida máxima"]

    constructor(scene: Game) {
        super(scene, "item-belt")
    }

    override applyModifier(creature: Creature): void {
        creature.maxHealth *= 1 + 0.1
    }
}
