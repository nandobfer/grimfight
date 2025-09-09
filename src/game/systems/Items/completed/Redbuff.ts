import { Creature } from "../../../creature/Creature"
import { Dot } from "../../../objects/Dot"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Redbuff extends Item {
    key = "redbuff"
    name = "Buff vermelho"
    descriptionLines = ["+35% AS", "Passiva: Ao atacar, aplica uma queimadura que causa 1% da vida máxima do inimigo, por segundo, dura 5 segundos."]
    burns = new WeakMap<Creature, Dot>()

    constructor(scene: Game) {
        super(scene, "item-redbuff")
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed *= 1 + 0.35

        const previousHandler = creature.eventHandlers.redbuff
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

        creature.eventHandlers.redbuff = applyBurn

        creature.on("dealt-damage", applyBurn)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.redbuff
        if (handler) {
            creature.off("dealt-damage", handler)
            delete creature.eventHandlers.redbuff
        }
    }
}
