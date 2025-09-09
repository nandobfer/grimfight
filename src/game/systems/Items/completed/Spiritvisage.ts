import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Spiritvisage extends Item {
    key = "spiritvisage"
    name = "Semblante Espiritual"
    descriptionLines = ['+10% vida máxima', "+5% resistência", "+20% mana/s", "Passiva: Cura 3% da vida faltante a cada segundo"]

    constructor(scene: Game) {
        super(scene, "item-spiritvisage")
    }

    override applyModifier(creature: Creature): void {
        creature.maxHealth *= 1 + 0.1
        creature.health *= 1 + 0.1
        creature.resistance += 5
        creature.manaPerSecond *= 1 + 0.2

        const previousHandler = creature.timeEvents.spiritvisage
        if (previousHandler) {
            this.scene.time.removeEvent(previousHandler)
        }

        const regenLife = () => {
            const missingHealthPercent = creature.getMissingHealthFraction()
            const multiplier = 1 - missingHealthPercent
            creature.heal(creature.maxHealth * 0.03 * multiplier, false, false)
        }

        creature.timeEvents.spiritvisage = this.scene.time.addEvent({ callback: regenLife, loop: true, delay: 1000 })

        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.timeEvents.spiritvisage
        if (handler) {
            this.scene.time.removeEvent(handler)
            delete creature.timeEvents.spiritvisage
        }
    }
}
