import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Nashor extends Item {
    key = "nashor"
    name = "Nashor's Tooth"
    descriptionLines = ["+15% AS", "+20% AP", "Passive: Deals 20% of AP when attacking."]

    constructor(scene: Game) {
        super(scene, "item-nashor")
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed += creature.baseAttackSpeed * 0.1
        creature.abilityPower += creature.baseAbilityPower * 0.2

        const previousHandler = creature.eventHandlers[`nashor_${this.id}`]
        if (previousHandler) {
            creature.off("afterAttack", previousHandler)
        }

        const afterAttack = (victim: Creature) => {
            const { value, crit } = creature.calculateDamage(creature.abilityPower * 0.2)
            victim.takeDamage(value, creature, "dark", crit, false)
        }

        creature.eventHandlers[`nashor_${this.id}`] = afterAttack

        creature.on("afterAttack", afterAttack)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`nashor_${this.id}`]
        if (handler) {
            creature.off("afterAttack", handler)
            delete creature.eventHandlers[`nashor_${this.id}`]
        }
    }
}
