import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Sterak extends Item {
    key = "sterak"
    name = "Sedenta por Sangue"
    descriptionLines = ["+20% AD", "20% vida máxima", "Passiva: Ao ficar com 50% de vida pela primeira vez, se cura em 40% da vida máxima"]

    constructor(scene: Game) {
        super(scene, "item-sterak")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage *= 1 + 0.2
        creature.maxHealth *= 1 + 0.2
        creature.health *= 1 + 0.2

        const previousHandler = creature.eventHandlers.sterak
        if (previousHandler) {
            creature.off("damage-taken", previousHandler)
        }

        const watchLife = (damage: number) => {
            if (creature.health / creature.maxHealth <= 0.5) {
                creature.heal(creature.maxHealth * 0.4)

                creature.off("damage-taken", watchLife)
            }
        }

        creature.eventHandlers.sterak = watchLife

        creature.on("damage-taken", watchLife)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.sterak
        if (handler) {
            creature.off("damage-taken", handler)
            delete creature.eventHandlers.sterak
        }
    }
}
