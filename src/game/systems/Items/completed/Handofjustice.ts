import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Handofjustice extends Item {
    key = "handofjustice"
    name = "Hand of Justice"
    descriptionLines = ["+15% AD", "+15% AP", "+20% critical chance", "+10% life steal"]

    constructor(scene: Game) {
        super(scene, "item-handofjustice")
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower += creature.baseAbilityPower * 0.15
        creature.attackDamage += creature.baseAttackDamage * 0.15
        creature.critChance += 20
        creature.lifesteal += 10
    }
}
