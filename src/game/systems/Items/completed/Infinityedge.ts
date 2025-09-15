import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Infinityedge extends Item {
    key = "infinityedge"
    name = "Infinity Edge"
    descriptionLines = ["+30% AD", "+25% critical chance", "+35% critical damage multiplier"]

    constructor(scene: Game) {
        super(scene, "item-infinityedge")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage += creature.baseAttackDamage * 0.3
        creature.critChance += 25
        creature.critDamageMultiplier += 0.35
    }
}
