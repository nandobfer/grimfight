import { Creature } from "../../../creature/Creature"
import { Dot } from "../../../objects/Dot"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Morello extends Item {
    key = "morello"
    name = "Morellonomicon"
    descriptionLines = [
        "+10% vida máxima",
        "+20% AP",
        "Passiva: Ao atacar, aplica uma queimadura que causa 1% da vida máxima do inimigo, por segundo, dura 5 segundos.",
    ]
    burns = new WeakMap<Creature, Dot>()

    constructor(scene: Game) {
        super(scene, "item-morello")
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower *= 1 + 0.2
        creature.maxHealth *= 1 + 0.1
        creature.health *= 1 + 0.1

        const previousHandler = creature.eventHandlers.morello
        if (previousHandler) {
            creature.off("dealt-damage", previousHandler)
        }

        const applyBurn = (victim: Creature, damage: number) => {
            const burn = this.burns.get(victim)
            if (!burn) {
                const burn = new Dot({
                    damageType: "fire",
                    duration: 5000,
                    target: victim,
                    tickDamage: victim.maxHealth * 0.01,
                    tickRate: 950,
                    user: creature,
                })
                this.burns.set(victim, burn)
                victim.applyStatusEffect(burn)
            } else {
                burn.resetDuration()
            }
        }

        creature.eventHandlers.morello = applyBurn

        creature.on("dealt-damage", applyBurn)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.morello
        if (handler) {
            creature.off("dealt-damage", handler)
            delete creature.eventHandlers.morello
        }
    }
}
