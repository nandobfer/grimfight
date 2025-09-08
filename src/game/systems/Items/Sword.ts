import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Item } from "./Item"

export class Sword extends Item {
    name = "sword"
    description = "blablabla"

    constructor(scene: Game) {
        super(scene, "item-sword")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage *= 1 + 0.1
    }
}
