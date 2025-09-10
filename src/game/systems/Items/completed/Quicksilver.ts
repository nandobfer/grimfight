import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Quicksilver extends Item {
    key = "quicksilver"
    name = "Faixa de Mercúrio"
    descriptionLines = ["+10% armadura", "+15% chance de crítico", "Passiva: Recebe chance de acerto crítico equivalente a sua armadura"]

    constructor(scene: Game) {
        super(scene, "item-quicksilver")
    }

    override applyModifier(creature: Creature): void {
        creature.armor += 10
        creature.critChance += 15

        creature.critChance += creature.armor
    }
}
