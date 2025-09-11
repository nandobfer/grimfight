import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Shojin extends Item {
    key = "shojin"
    name = "Lança de Shojin"
    descriptionLines = ["+15% AD", "+5 mana /ataque"]

    constructor(scene: Game) {
        super(scene, "item-shojin")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage += creature.baseAttackDamage * 0.15
        creature.manaPerAttack += 5
    }
}
