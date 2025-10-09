import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Manazane extends Item {
    key = "manazane"
    name = "Manazane"
    descriptionLines = ['+30% AD',"+3 mana /attack", "Passive: When casting for the first time, regenerates 200 mana over 5 seconds."]

    constructor(scene: Game) {
        super(scene, "item-manazane")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatPercent("attackDamage", 30)
        creature.addStatValue("manaPerAttack", 3)

        const previousHandler = creature.eventHandlers[`manazane_${this.id}`]
        if (previousHandler) {
            creature.off("cast", previousHandler)
        }

        const onCast = () => {
            if (!creature.buffs.has(`manazane_${this.id}`)) {
                creature.buffs.add(`manazane_${this.id}`)

                creature.addStatValue("manaPerSecond", 40) // 200 mana over 5 seconds
                const timer = creature.scene.time.addEvent({
                    delay: 5000,
                    callback: () => {
                        creature.addStatValue("manaPerSecond", -40)
                    }
                })
                creature.timeEvents[`manazane_${this.id}`] = timer
            }
        }

        creature.eventHandlers[`manazane_${this.id}`] = onCast

        creature.on("cast", onCast)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`manazane_${this.id}`]
        if (handler) {
            creature.off("cast", handler)
            delete creature.eventHandlers[`manazane_${this.id}`]
        }

        const timer = creature.timeEvents[`manazane_${this.id}`]
        if (timer) {
            this.scene.time.removeEvent(timer)
            delete creature.timeEvents[`manazane_${this.id}`]
        }

        creature.buffs.delete(`manazane_${this.id}`)
    }
}
