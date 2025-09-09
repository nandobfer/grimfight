import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Bow extends Item {
    key = "bow"
    name = "Arco"
    descriptionLines = ["+10% velocidade de ataque"]

    constructor(scene: Game) {
        super(scene, "item-bow")
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed *= 1 + 0.1
    }
}
