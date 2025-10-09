import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class TrinityForce extends Item {
    key = "trinityforce"
    name = "Trinity's Force"
    descriptionLines = ["+50% AD", "+50% AP", "+50% AS"]

    constructor(scene: Game) {
        super(scene, "item-trinityforce")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatPercent("attackDamage", 50)
        creature.addStatPercent("abilityPower", 50)
        creature.addStatPercent("attackSpeed", 50)
    }
}
