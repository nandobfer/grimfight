import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Lastwhisper extends Item {
    key = "lastwhisper"
    name = "Lastwhisper"
    descriptionLines = ["+15% AS", "+60% critical damage multiplier"]

    constructor(scene: Game) {
        super(scene, "item-lastwhisper")
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed += creature.baseAttackSpeed * 0.15
        creature.critDamageMultiplier += 0.6
    }
}
