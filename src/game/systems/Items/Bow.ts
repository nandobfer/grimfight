import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Item } from "./Item"

export class Bow extends Item {
    name = "bow"
    description = "blablabla"

    constructor(scene: Game) {
        super(scene, "item-bow")
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed *= 1 + 0.1
    }
}
