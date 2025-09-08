import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Item } from "./Item"

export class Vest extends Item {
    name = "vest"
    description = "blablabla"

    constructor(scene: Game) {
        super(scene, "item-vest")
    }

    override applyModifier(creature: Creature): void {
        creature.resistance += 5
    }
}
