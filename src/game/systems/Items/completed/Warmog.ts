import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Warmog extends Item {
    key = "warmog"
    name = "Warmog's Armor"
    descriptionLines = ["+45% max health"]

    constructor(scene: Game) {
        super(scene, "item-warmog")
    }

    override applyModifier(creature: Creature): void {
        creature.maxHealth += creature.baseMaxHealth * 0.45
        creature.health += creature.baseMaxHealth * 0.45
    }
}
