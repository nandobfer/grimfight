import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Evenshroud extends Item {
    key = "evenshroud"
    name = "Mortalha sei lá o que"
    descriptionLines = ["+15% vida máxima", "+10% resistência"]

    constructor(scene: Game) {
        super(scene, "item-evenshroud")
    }

    override applyModifier(creature: Creature): void {
        creature.maxHealth *= 1 + 0.15
        creature.health *= 1 + 0.15
        creature.resistance += 10
    }
}
