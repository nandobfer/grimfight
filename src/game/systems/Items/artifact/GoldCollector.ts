import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class GoldCollector extends Item {
    key = "goldcollector"
    name = "Gold Collector"
    descriptionLines = ["+40% AD", "+40% crit chance", "Passive: Attacking an enemy under 10% health instantly kills them."]

    constructor(scene: Game) {
        super(scene, "item-goldcollector")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatValue("attackDamage", 40)
        creature.addStatValue("critChance", 40)

        const previousHandler = creature.eventHandlers[`goldcollector_${this.id}`]
        if (previousHandler) {
            creature.off("dealt-damage", previousHandler)
        }

        const onDamageDealt = (victim: Creature) => {
            if (victim.health / victim.maxHealth <= 0.1) {
                victim.takeDamage(victim.health, creature, "true", false, false, this.name)
            }
         }

        creature.eventHandlers[`goldcollector_${this.id}`] = onDamageDealt

        creature.on("dealt-damage", onDamageDealt)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`goldcollector_${this.id}`]
        if (handler) {
            creature.off("dealt-damage", handler)
            delete creature.eventHandlers[`goldcollector_${this.id}`]
        }
    }
}
