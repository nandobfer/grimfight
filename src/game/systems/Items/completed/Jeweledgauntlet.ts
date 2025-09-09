import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Jeweledgauntlet extends Item {
    key = "jeweledgauntlet"
    name = "Manoplas Encrustradas"
    descriptionLines = ["+30% AP", '25% chance de crítico']

    constructor(scene: Game) {
        super(scene, "item-jeweledgauntlet")
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower *= 1 + 0.3
        creature.critChance += 25
    }
}
