import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Infinityedge extends Item {
    key = "infinityedge"
    name = "Mata Gigantes"
    descriptionLines = ["+30% AD", "+25% chance de crítico", "+35% multiplicador de dano crítico"]

    constructor(scene: Game) {
        super(scene, "item-infinityedge")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage *= 1 + 0.3
        creature.critChance += 25
        creature.critDamageMultiplier += 0.35
    }
}
