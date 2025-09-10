import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Gargoylestoneplate extends Item {
    key = "gargoylestoneplate"
    name = "Placa Gargolítica"
    descriptionLines = ["+20% resistência"]

    constructor(scene: Game) {
        super(scene, "item-gargoylestoneplate")
    }

    override applyModifier(creature: Creature): void {
        creature.armor += 20
    }
}
