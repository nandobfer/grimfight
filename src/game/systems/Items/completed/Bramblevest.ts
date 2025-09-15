import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Bramblevest extends Item {
    key = "bramblevest"
    name = "Bramble Vest"
    descriptionLines = ["+5% max health", "+15% armor", "Passive: When hit, deals damage to the attacker based on your max health"]

    constructor(scene: Game) {
        super(scene, "item-bramblevest")
    }

    override applyModifier(creature: Creature): void {
        creature.maxHealth += 0.05 * creature.baseMaxHealth
        creature.health += 0.05 * creature.baseMaxHealth
        creature.armor += 15

        const previousHandler = creature.eventHandlers[`bramblevest_${this.id}`]
        if (previousHandler) {
            creature.off("damage-taken", previousHandler)
        }

        const dealThorns = (damage: number, attacker: Creature) => {
            const thornsDamage = creature.calculateDamage(creature.maxHealth * 0.01)
            attacker.takeDamage(Math.max(thornsDamage.value, attacker.maxHealth * 0.01), creature, "normal", thornsDamage.crit, false)
        }

        creature.eventHandlers[`bramblevest_${this.id}`] = dealThorns

        creature.on("damage-taken", dealThorns)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`bramblevest_${this.id}`]
        if (handler) {
            creature.off("damage-taken", handler)
            delete creature.eventHandlers[`bramblevest_${this.id}`]
        }
    }
}
