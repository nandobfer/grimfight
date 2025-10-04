import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Bloodthirster extends Item {
    key = "bloodthirster"
    name = "Bloodthirster"
    descriptionLines = [
        "+20% AD",
        "+5% armor",
        "+20% life steal",
        "Passive: Upon falling to 40% health for the first time, receives a shield for 25% of max health",
    ]

    constructor(scene: Game) {
        super(scene, "item-bloodthirster")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage += 0.2 * creature.baseAttackDamage
        creature.armor += 5
        creature.lifesteal += 20

        const previousHandler = creature.eventHandlers[`bloodthirster_${this.id}`]
        if (previousHandler) {
            creature.off("damage-taken", previousHandler)
        }

        const watchLife = (damage: number) => {
            if (creature.health / creature.maxHealth <= 0.4) {
                creature.gainShield(creature.maxHealth * 0.25, { healer: creature, source: this.name })

                creature.off("damage-taken", watchLife)
            }
        }

        creature.eventHandlers[`bloodthirster_${this.id}`] = watchLife

        creature.on("damage-taken", watchLife)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`bloodthirster_${this.id}`]
        if (handler) {
            creature.off("damage-taken", handler)
            delete creature.eventHandlers[`bloodthirster_${this.id}`]
        }
    }
}
