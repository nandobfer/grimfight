import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Sterak extends Item {
    key = "sterak"
    name = "Amuleto de Sterak"
    descriptionLines = ["+20% AD", "+20% vida máxima", "Passiva: Ao ficar com 50% de vida pela primeira vez, recebe um escudo de 40% da vida máxima"]

    constructor(scene: Game) {
        super(scene, "item-sterak")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage += creature.baseAttackDamage * 0.2
        creature.maxHealth += creature.baseMaxHealth * 0.2
        creature.health += creature.baseMaxHealth * 0.2

        const previousHandler = creature.eventHandlers[`sterak_${this.id}`]
        if (previousHandler) {
            creature.off("damage-taken", previousHandler)
        }

        const watchLife = (damage: number) => {
            if (creature.health / creature.maxHealth <= 0.5) {
                creature.gainShield(creature.maxHealth * 0.4)

                creature.off("damage-taken", watchLife)
            }
        }

        creature.eventHandlers[`sterak_${this.id}`] = watchLife

        creature.on("damage-taken", watchLife)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`sterak_${this.id}`]
        if (handler) {
            creature.off("damage-taken", handler)
            delete creature.eventHandlers[`sterak_${this.id}`]
        }
    }
}
