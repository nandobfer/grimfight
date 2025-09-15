import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Strikersflail extends Item {
    key = "strikersflail"
    name = "Striker's Flail"
    descriptionLines = ["+10% max health", "+10% critical chance", "Passive: Gains bonus max health equivalent to critical hit chance"]

    constructor(scene: Game) {
        super(scene, "item-strikersflail")
    }

    override applyModifier(creature: Creature): void {
        creature.maxHealth += creature.baseMaxHealth * 0.1
        creature.health += creature.baseMaxHealth * 0.1
        creature.critChance += 10

        const multiplierFromCrit = creature.critChance / 100
        creature.maxHealth += creature.baseMaxHealth * multiplierFromCrit
        creature.health += creature.baseMaxHealth * multiplierFromCrit
    }
}
