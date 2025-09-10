import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Dragonclaw extends Item {
    key = "dragonclaw"
    name = "Garra do Dragão"
    descriptionLines = ["+5% vida máxima", "+15% armadura", "Passiva: Cura 3% da vida máxima a cada 2 segundos"]

    constructor(scene: Game) {
        super(scene, "item-dragonclaw")
    }

    override applyModifier(creature: Creature): void {
        creature.maxHealth *= 1 + 0.05
        creature.health *= 1 + 0.05
        creature.armor += 15

        const previousHandler = creature.timeEvents.dragonclaw
        if (previousHandler) {
            this.scene.time.removeEvent(previousHandler)
        }

        const regenLife = () => {
            creature.heal(creature.maxHealth * 0.03, false, false)
        }

        creature.timeEvents.dragonclaw = this.scene.time.addEvent({ callback: regenLife, loop: true, delay: 2000 })

        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.timeEvents.dragonclaw
        if (handler) {
            this.scene.time.removeEvent(handler)
            delete creature.timeEvents.dragonclaw
        }
    }
}
