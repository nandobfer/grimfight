import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Cloak extends Item {
    key = "cloak"
    name = "Capa"
    descriptionLines = ["+5% armadura"]

    constructor(scene: Game) {
        super(scene, "item-cloak")
    }

    override applyModifier(creature: Creature): void {
        creature.armor += 5
    }
}
