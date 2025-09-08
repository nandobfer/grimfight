import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Item } from "./Item"

export class Tear extends Item {
    name = "tear"
    description = "blablabla"

    constructor(scene: Game) {
        super(scene, "item-tear")
    }

    override applyModifier(creature: Creature): void {
        creature.manaPerSecond *= 1 + 0.2
    }
}
