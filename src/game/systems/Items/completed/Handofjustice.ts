import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Handofjustice extends Item {
    key = "handofjustice"
    name = "Mão da Justiça"
    descriptionLines = ["+15% AD", "+15% AP", '+20% chance de crítico', '+10% roubo de vida']

    constructor(scene: Game) {
        super(scene, "item-handofjustice")
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower *= 1 + 0.15
        creature.attackDamage *= 1 + 0.15
        creature.critChance += 20
        creature.lifesteal += 10
    }
}
