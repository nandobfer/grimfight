import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Strikersflail extends Item {
    key = "strikersflail"
    name = "Mangual do Atacante"
    descriptionLines = ["+15% vida máxima", "+15% chance de crítico", "Passiva: Recebe vida máxima bônus equivalente a chance de acerto crítico"]

    constructor(scene: Game) {
        super(scene, "item-strikersflail")
    }

    override applyModifier(creature: Creature): void {
        creature.maxHealth *= 1 + 0.15
        creature.health *= 1 + 0.15
        creature.critChance += 15

        const multiplierFromCrit = creature.critChance / 100
        creature.maxHealth *= 1 + multiplierFromCrit
        creature.health *= 1 + multiplierFromCrit
    }
}
