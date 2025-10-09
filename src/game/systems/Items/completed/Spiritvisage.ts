import { Character } from "../../../creature/character/Character"
import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Spiritvisage extends Item {
    key = "spiritvisage"
    name = "Spirit Visage"
    descriptionLines = ["+10% max health", "+5% armor", "+3 mana/s", "Passive: Heals 5% of missing health every second"]

    constructor(scene: Game) {
        super(scene, "item-spiritvisage")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.maxHealth += creature.baseMaxHealth * 0.1
        creature.health += creature.baseMaxHealth * 0.1
        creature.armor += 5
        creature.manaPerSecond += 3

        const factor = creature instanceof Character ? 0.05 : 0.03

        const previousHandler = creature.timeEvents[`spiritvisage_${this.id}`]
        if (previousHandler) {
            this.scene.time.removeEvent(previousHandler)
        }

        const regenLife = () => {
            if (this.scene.state !== "fighting") return
            const missingHealthPercent = creature.getMissingHealthFraction()
            const multiplier = 1 - missingHealthPercent
            creature.heal(creature.maxHealth * factor * multiplier, false, false, { healer: creature, source: this.name })
        }

        creature.timeEvents[`spiritvisage_${this.id}`] = this.scene.time.addEvent({ callback: regenLife, loop: true, delay: 1000 })

        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.timeEvents[`spiritvisage_${this.id}`]
        if (handler) {
            this.scene.time.removeEvent(handler)
            delete creature.timeEvents[`spiritvisage_${this.id}`]
        }
    }
}
