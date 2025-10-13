import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class WitsEnd extends Item {
    key = "witsend"
    name = "Wit's End"
    descriptionLines = ["+30% AS", "+30% AP", "Passive: Deals 20% of AP when attacking and heals for the same amount."]

    constructor(scene: Game) {
        super(scene, "item-witsend")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatPercent("attackSpeed", 30)
        creature.addStatPercent("abilityPower", 30)

        const previousHandler = creature.eventHandlers[`witsend_${this.id}`]
        if (previousHandler) {
            creature.off("afterAttack", previousHandler)
        }

        const afterAttack = (victim: Creature) => {
            const { value, crit } = creature.calculateDamage(creature.abilityPower * 0.2)
            victim.takeDamage(value, creature, "dark", crit, false, this.name)
            creature.heal(value, { healer: creature, source: this.name })
        }

        creature.eventHandlers[`witsend_${this.id}`] = afterAttack

        creature.on("afterAttack", afterAttack)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`witsend_${this.id}`]
        if (handler) {
            creature.off("afterAttack", handler)
            delete creature.eventHandlers[`witsend_${this.id}`]
        }
    }
}
