import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Dawncore extends Item {
    key = "dawncore"
    name = "Dawncore"
    descriptionLines = ["+5 mana/s", "Passive: Maximum mana reduced by 15", "Passive: When cast, reduces maximum by 5. Minimum of 15."]

    constructor(scene: Game) {
        super(scene, "item-dawncore")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatValue("manaPerSecond", 5)
        creature.addStatValue("maxMana", -15)

        const previousHandler = creature.eventHandlers[`dawncore_${this.id}`]
        if (previousHandler) {
            creature.off("cast", previousHandler)
        }

        const onCast = () => {
            if (creature.maxMana > 15) {
                creature.addStatValue("maxMana", -5)
            }
        }

        creature.eventHandlers[`dawncore_${this.id}`] = onCast

        creature.on("cast", onCast)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`dawncore_${this.id}`]
        if (handler) {
            creature.off("cast", handler)
            delete creature.eventHandlers[`dawncore_${this.id}`]
        }
    }
}
