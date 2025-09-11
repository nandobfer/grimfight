import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Ionicspark extends Item {
    key = "ionicspark"
    name = "Centelha Iônica"
    descriptionLines = ["+25% AP", "+10% armadura"]

    constructor(scene: Game) {
        super(scene, "item-ionicspark")
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower += creature.baseAbilityPower * 0.25
        creature.armor += 10
    }
}
