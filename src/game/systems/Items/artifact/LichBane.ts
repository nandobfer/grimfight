import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class LichBane extends Item {
    key = "lichbane"
    name = "Lich Bane"
    descriptionLines = ["+40% AP", "Passive: When cast, your next basic attack deals an additional 200% AP as damage."]

    constructor(scene: Game) {
        super(scene, "item-lichbane")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatPercent("abilityPower", 40)

        const previousHandler = creature.eventHandlers[`lichbane_${this.id}`]
        if (previousHandler) {
            creature.off("cast", previousHandler)
        }

        const onCast = () => {
            const original = creature.onAttackLand.bind(creature)

            creature.onAttackLand = () => {
                creature.onAttackLand = original
                const { value, crit } = creature.calculateDamage(creature.abilityPower * 2)
                creature.target?.takeDamage(value, creature, "dark", crit, false, this.name)
                const normalDamage = creature.onAttackLand("normal")
                return normalDamage + value
            }
        }

        creature.eventHandlers[`lichbane_${this.id}`] = onCast

        creature.on("cast", onCast)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`lichbane_${this.id}`]
        if (handler) {
            creature.off("cast", handler)
            delete creature.eventHandlers[`lichbane_${this.id}`]
        }
    }
}
