import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Gloves extends Item {
    key = "gloves"
    name = "Luvas da agilidade"
    descriptionLines = ["+10% chance de acerto crítico"]

    constructor(scene: Game) {
        super(scene, "item-gloves")
    }

    override applyModifier(creature: Creature): void {
        creature.critChance += 10
    }
}
