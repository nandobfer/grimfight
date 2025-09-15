import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Giantslayer extends Item {
    key = "giantslayer"
    name = "Giantslayer"
    descriptionLines = ["+20 AD", "+20 AS"]

    constructor(scene: Game) {
        super(scene, "item-giantslayer")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage += creature.baseAttackDamage * 0.2
        creature.attackSpeed += creature.baseAttackSpeed * 0.2
    }
}
