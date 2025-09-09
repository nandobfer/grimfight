import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Lastwhisper extends Item {
    key = "lastwhisper"
    name = "Último Sussurro"
    descriptionLines = ["+15% AS", '+60% multiplicador de dano crítico']

    constructor(scene: Game) {
        super(scene, "item-lastwhisper")
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed *= 1 + 0.15
        creature.critDamageMultiplier += 0.6
    }
}
