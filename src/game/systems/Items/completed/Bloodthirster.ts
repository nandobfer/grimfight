import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Bloodthirster extends Item {
    key = "bloodthirster"
    name = "Sedenta por Sangue"
    descriptionLines = [
        "+20% AD",
        "+5% resistência",
        "+20% roubo de vida",
        "Passiva: Ao ficar com 40% de vida pela primeira vez, recebe um escudo de 25% da vida máxima",
    ]

    constructor(scene: Game) {
        super(scene, "item-bloodthirster")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage *= 1 + 0.2
        creature.armor += 5
        creature.lifesteal += 20

        const previousHandler = creature.eventHandlers.bloodthirster
        if (previousHandler) {
            creature.off("damage-taken", previousHandler)
        }

        const watchLife = (damage: number) => {
            if (creature.health / creature.maxHealth <= 0.4) {
                creature.gainShield(creature.maxHealth * 0.25)

                creature.off("damage-taken", watchLife)
            }
        }

        creature.eventHandlers.bloodthirster = watchLife

        creature.on("damage-taken", watchLife)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.bloodthirster
        if (handler) {
            creature.off("damage-taken", handler)
            delete creature.eventHandlers.bloodthirster
        }
    }
}
