import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Deathblade extends Item {
    key = "deathblade"
    name = "Lâmina Mortal"
    descriptionLines = ["+50% AD"]

    constructor(scene: Game) {
        super(scene, "item-deathblade")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage += creature.baseAttackDamage * 0.5
    }
}
