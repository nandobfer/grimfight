import { Character } from "../../../creature/character/Character"
import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Dragonclaw extends Item {
    key = "dragonclaw"
    name = "Dragon Claw"
    descriptionLines = ["+5% max health", "+15% armor", "Passive: Heals 5% of max health every 2 seconds"]

    constructor(scene: Game) {
        super(scene, "item-dragonclaw")
    }

    override applyModifier(creature: Creature): void {
        creature.maxHealth += creature.baseMaxHealth * 0.05
        creature.health += creature.baseMaxHealth * 0.05
        creature.armor += 15

        const factor = creature instanceof Character ? 0.05 : 0.03

        const previousHandler = creature.timeEvents[`dragonclaw_${this.id}`]
        if (previousHandler) {
            this.scene.time.removeEvent(previousHandler)
        }

        const regenLife = () => {
            creature.heal(creature.maxHealth * factor, false, false, { healer: creature, source: this.name })
        }

        creature.timeEvents[`dragonclaw_${this.id}`] = this.scene.time.addEvent({ callback: regenLife, loop: true, delay: 2000 })

        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.timeEvents[`dragonclaw_${this.id}`]
        if (handler) {
            this.scene.time.removeEvent(handler)
            delete creature.timeEvents[`dragonclaw_${this.id}`]
        }
    }
}
