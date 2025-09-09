import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Bluebuff extends Item {
    key = "bluebuff"
    name = "Buff Azul"
    descriptionLines = ["+50% mana/s"]

    constructor(scene: Game) {
        super(scene, "item-bluebuff")
    }

    override applyModifier(creature: Creature): void {
        creature.manaPerSecond *= 1 + 0.5
    }
}
