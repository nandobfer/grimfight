import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Hullcrusher extends Item {
    key = "hullcrusher"
    name = "Hullcrusher"
    descriptionLines = ["+30% AD", "+20% Max health", "+10% armor", "Passive: If there is no character adjacent to you, this item grants double bonuses."]

    constructor(scene: Game) {
        super(scene, "item-hullcrusher")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        const factor = creature.getAdjacentAllies().length === 0 ? 2 : 1

        creature.addStatPercent("attackDamage", 30 * factor)
        creature.addStatPercent("maxHealth", 20 * factor)
        creature.addStatPercent("health", 20 * factor)
        creature.addStatValue("armor", 10 * factor)
    }
}
