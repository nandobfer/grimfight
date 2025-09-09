import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Giantslayer extends Item {
    key = "giantslayer"
    name = "Mata Gigantes"
    descriptionLines = ["+15% AD", '15% AS']

    constructor(scene: Game) {
        super(scene, "item-giantslayer")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage *= 1 + 0.15
        creature.attackSpeed *= 1 + 0.15
    }
}
