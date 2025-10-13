import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class InnervatingLocket extends Item {
    key = "innervatinglocket"
    name = "Innervating Locket"
    descriptionLines = ["+30% Max health", "+3 mana on hit taken", 'Passive: When cast, heal for 20% health.']

    constructor(scene: Game) {
        super(scene, "item-innervatinglocket")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatPercent("maxHealth", 30)
        creature.addStatPercent("health", 30)
        creature.addStatValue("manaOnHit", 3)

        const previousHandler = creature.eventHandlers[`innervatinglocket_${this.id}`]
        if (previousHandler) {
            creature.off("cast", previousHandler)
        }

        const onCast = () => {
            creature.heal(creature.maxHealth * 0.2, { healer: creature, source: this.name })
        }

        creature.eventHandlers[`innervatinglocket_${this.id}`] = onCast

        creature.on("cast", onCast)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`innervatinglocket_${this.id}`]
        if (handler) {
            creature.off("cast", handler)
            delete creature.eventHandlers[`innervatinglocket_${this.id}`]
        }
    }
}
