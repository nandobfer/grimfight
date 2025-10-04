import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Hextechgunblade extends Item {
    key = "hextechgunblade"
    name = "Hextech Gun Blade"
    descriptionLines = ["+20% AD", "+20% AP", "Passive: Heals the ally with the lowest health percentage for 20% of damage dealt"]

    constructor(scene: Game) {
        super(scene, "item-hextechgunblade")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage += creature.baseAttackDamage * 0.2
        creature.abilityPower += creature.baseAbilityPower * 0.2

        const previousHandler = creature.eventHandlers[`hextechgunblade_${this.id}`]
        if (previousHandler) {
            creature.off("dealt-damage", previousHandler)
        }

        const healFriend = (victim: Creature, damage: number) => {
            const friend = creature.team.getLowestHealth()
            friend?.heal(damage * 0.2, false, true, { healer: creature, source: this.name })
        }

        creature.eventHandlers[`hextechgunblade_${this.id}`] = healFriend

        creature.on("dealt-damage", healFriend)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`hextechgunblade_${this.id}`]
        if (handler) {
            creature.off("dealt-damage", handler)
            delete creature.eventHandlers[`hextechgunblade_${this.id}`]
        }
    }
}
