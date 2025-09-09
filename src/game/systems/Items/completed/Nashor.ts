import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Nashor extends Item {
    key = "nashor"
    name = "Dente de Nashor"
    descriptionLines = ["+15% AS", "+20% AP", "Passiva: Causa 20% do AP ao atacar."]

    constructor(scene: Game) {
        super(scene, "item-nashor")
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed *= 1 + 0.1
        creature.abilityPower *= 1 + 0.2

        const previousHandler = creature.eventHandlers.nashor
        if (previousHandler) {
            creature.off("dealt-damage", previousHandler)
        }

        const dealDamage = (victim: Creature, damage: number) => {
            const { value, crit } = creature.calculateDamage(creature.abilityPower * 0.2)
            victim.takeDamage(value, creature, "dark", crit, false)
        }

        creature.eventHandlers.nashor = dealDamage

        creature.on("dealt-damage", dealDamage)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.nashor
        if (handler) {
            creature.off("dealt-damage", handler)
            delete creature.eventHandlers.nashor
        }
    }
}
