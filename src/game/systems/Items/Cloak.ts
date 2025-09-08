import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Item } from "./Item"

export class Cloak extends Item {
    name = "cloak"
    description = "blablabla"

    constructor(scene: Game) {
        super(scene, "item-cloak")
    }

    override applyModifier(creature: Creature): void {
        creature.resistance += 5
    }
}
