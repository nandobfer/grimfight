import { Creature } from "../../../creature/Creature"
import { Dot } from "../../../objects/Dot"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Sunfire extends Item {
    key = "sunfire"
    name = "Capa de Fogo Solar"
    descriptionLines = [
        "+10% vida máxima",
        '+10% resistência',
        "Passiva: Ao ser atacado, aplica uma queimadura no inimigo que causa 1% da vida máxima do atacante, por segundo, dura 5 segundos.",
    ]
    burns = new WeakMap<Creature, Dot>()

    constructor(scene: Game) {
        super(scene, "item-sunfire")
    }

    override applyModifier(creature: Creature): void {
        creature.armor += 10
        creature.maxHealth *= 1 + 0.1
        creature.health *= 1 + 0.1

        const previousHandler = creature.eventHandlers.sunfire
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
                attacker.applyStatusEffect(burn)
            } else {
                burn.resetDuration()
            }
        }

        creature.eventHandlers.sunfire = applyBurn

        creature.on("damage-taken", applyBurn)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.sunfire
        if (handler) {
            creature.off("damage-taken", handler)
            delete creature.eventHandlers.sunfire
        }
    }

}
