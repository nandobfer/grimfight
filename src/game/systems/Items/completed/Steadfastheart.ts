import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Steadfastheart extends Item {
    key = "steadfastheart"
    name = "Steadfast Heart"
    descriptionLines = [
        "+10% armor",
        "+15% critical chance",
        "Passive: When receiving damage, has a chance equivalent to critical hit chance to receive a shield equal to half the damage taken.",
    ]

    constructor(scene: Game) {
        super(scene, "item-steadfastheart")
    }

    override applyModifier(creature: Creature): void {
        creature.armor += 10
        creature.critChance += 15

        const previousHandler = creature.eventHandlers[`steadfastheart_${this.id}`]
        if (previousHandler) {
            creature.off("damage-taken", previousHandler)
        }

        const critGuard = (damage: number) => {
            const crit = creature.tryCrit()
            if (crit) {
                creature.gainShield(damage * 0.5, { healer: creature, source: this.name })
            }
        }

        creature.eventHandlers[`steadfastheart_${this.id}`] = critGuard

        creature.on("damage-taken", critGuard)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`steadfastheart_${this.id}`]
        if (handler) {
            creature.off("damage-taken", handler)
            delete creature.eventHandlers[`steadfastheart_${this.id}`]
        }
    }
}
