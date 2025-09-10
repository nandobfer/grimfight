import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Steadfastheart extends Item {
    key = "steadfastheart"
    name = "Coração Inabalável"
    descriptionLines = [
        "+10% resistência",
        "+15% chance de crítico",
        "Passiva: Ao receber dano, tem uma chance equivalente a chance de acerto crítico de receber um escudo equivalente a metade do dano sofrido.",
    ]

    constructor(scene: Game) {
        super(scene, "item-steadfastheart")
    }

    override applyModifier(creature: Creature): void {
        creature.armor += 10
        creature.critChance += 15

        const previousHandler = creature.eventHandlers.steadfastheart
        if (previousHandler) {
            creature.off("damage-taken", previousHandler)
        }

        const critGuard = (damage: number) => {
            const crit = creature.tryCrit()
            if (crit) {
                creature.gainShield(damage * 0.5)
            }
        }

        creature.eventHandlers.steadfastheart = critGuard

        creature.on("damage-taken", critGuard)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.steadfastheart
        if (handler) {
            creature.off("damage-taken", handler)
            delete creature.eventHandlers.steadfastheart
        }
    }
}
