import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Rod extends Item {
    key = "rod"
    name = "Bastão desnecessariamente grande"
    descriptionLines = ["+10% AP"]

    constructor(scene: Game) {
        super(scene, "item-rod")
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower += creature.baseAbilityPower * 0.1
    }
}
