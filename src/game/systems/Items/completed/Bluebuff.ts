import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Bluebuff extends Item {
    key = "bluebuff"
    name = "Blue Buff"
    descriptionLines = ["+5 mana/s", "Passive: Maximum mana reduced by 15"]

    constructor(scene: Game) {
        super(scene, "item-bluebuff")
    }

    override applyModifier(creature: Creature): void {
        creature.manaPerSecond += 5
        creature.maxMana -= 15
    }
}
