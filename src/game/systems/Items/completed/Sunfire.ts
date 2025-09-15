import { Creature } from "../../../creature/Creature"
import { Dot } from "../../../objects/StatusEffect/Dot"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Sunfire extends Item {
    key = "sunfire"
    name = "Sunfire Cape"
    descriptionLines = [
    "+10% max health",
    "+10% armor",
    "Passive: When attacked, applies a burn on the enemy that deals 1% of the attacker's max health per second, lasts 5 seconds."
]
    burns = new WeakMap<Creature, Dot>()

    constructor(scene: Game) {
        super(scene, "item-sunfire")
    }

    override applyModifier(creature: Creature): void {
        creature.armor += 10
        creature.maxHealth += creature.baseMaxHealth * 0.1
        creature.health += creature.baseMaxHealth * 0.1

        const previousHandler = creature.eventHandlers[`sunfire_${this.id}`]
        if (previousHandler) {
            creature.off("damage-taken", previousHandler)
        }

        const applyBurn = (damage: number, attacker: Creature) => {
            const burn = this.burns.get(attacker)
            if (!burn) {
                const burn = new Dot({
                    damageType: "fire",
                    duration: 5000,
                    target: attacker,
                    tickDamage: attacker.maxHealth * 0.01,
                    tickRate: 950,
                    user: creature,
                })
                this.burns.set(attacker, burn)
                burn.start()
            } else {
                burn.resetDuration()
            }
        }

        creature.eventHandlers[`sunfire_${this.id}`] = applyBurn

        creature.on("damage-taken", applyBurn)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`sunfire_${this.id}`]
        if (handler) {
            creature.off("damage-taken", handler)
            delete creature.eventHandlers[`sunfire_${this.id}`]
        }
    }
}
