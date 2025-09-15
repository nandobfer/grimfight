import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Jeweledgauntlet extends Item {
    key = "jeweledgauntlet"
    name = "Jeweled Gauntlet"
    descriptionLines = ["+30% AP", "+25% critical chance", "+35% critical damage multiplier"]

    constructor(scene: Game) {
        super(scene, "item-jeweledgauntlet")
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower += creature.baseAbilityPower * 0.3
        creature.critChance += 25
        creature.critDamageMultiplier += 0.35
    }
}
