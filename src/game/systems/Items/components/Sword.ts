import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Sword extends Item {
    key = "sword"
    name = "Espada grande pra caralho"
    descriptionLines = ["+10% AD"]

    constructor(scene: Game) {
        super(scene, "item-sword")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage *= 1 + 0.1
    }
}
