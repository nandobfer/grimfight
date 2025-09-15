import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Bow extends Item {
    key = "bow"
    name = "Bow"
    descriptionLines = ["+10% AS"]

    constructor(scene: Game) {
        super(scene, "item-bow")
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed += creature.baseAttackSpeed * 0.1
    }
}
