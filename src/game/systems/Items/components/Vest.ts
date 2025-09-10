import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Vest extends Item {
    key = "vest"
    name = "Cota de malha"
    descriptionLines = ["+5% armadura"]

    constructor(scene: Game) {
        super(scene, "item-vest")
    }

    override applyModifier(creature: Creature): void {
        creature.armor += 5
    }
}
