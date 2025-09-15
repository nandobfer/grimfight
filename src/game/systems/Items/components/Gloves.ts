import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Gloves extends Item {
    key = "gloves"
    name = "Gloves"
    descriptionLines = ["+10% critical chance"]

    constructor(scene: Game) {
        super(scene, "item-gloves")
    }

    override applyModifier(creature: Creature): void {
        creature.critChance += 10
    }
}
