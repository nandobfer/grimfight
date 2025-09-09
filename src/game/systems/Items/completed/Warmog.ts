import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Warmog extends Item {
    key = "warmog"
    name = "Armadura de Warmog"
    descriptionLines = ["+40% vida máxima"]

    constructor(scene: Game) {
        super(scene, "item-warmog")
    }

    override applyModifier(creature: Creature): void {
        creature.maxHealth *= 1 + 0.4
        creature.health *= 1 + 0.4
    }
}
