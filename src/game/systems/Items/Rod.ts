import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Item } from "./Item"

export class Rod extends Item {
    name = "rod"
    description = "blablabla"

    constructor(scene: Game) {
        super(scene, "item-rod")
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower *= 1 + 0.1
    }
}
