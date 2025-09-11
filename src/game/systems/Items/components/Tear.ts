import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Tear extends Item {
    key = "tear"
    name = "Lágrima"
    descriptionLines = ["+2 mana/s"]

    constructor(scene: Game) {
        super(scene, "item-tear")
    }

    override applyModifier(creature: Creature): void {
        creature.manaPerSecond += 2
    }
}
