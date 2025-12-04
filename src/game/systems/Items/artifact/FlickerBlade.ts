import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class FlickerBlade extends Item {
    key = "flickerblade"
    name = "Flicker Blade"
    descriptionLines = ["+30% AD", "+30% AP", "+40% AS", "Passive: Gain 1% AS, 1% AD and 1% AP when attacking."]

    constructor(scene: Game) {
        super(scene, "item-flickerblade")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatPercent("attackDamage", 30)
        creature.addStatPercent("abilityPower", 30)
        creature.addStatPercent("attackSpeed", 40)

        const previousHandler = creature.eventHandlers[`flickerblade_${this.id}`]
        if (previousHandler) {
            creature.off("afterAttack", previousHandler)
        }

        const onHit = (victim: Creature) => {
            creature.addStatPercent("attackSpeed", 1)
            creature.addStatPercent("attackDamage", 1)
            creature.addStatPercent("abilityPower", 1)

            if (creature.bonusAttackSpeed) creature.bonusAttackSpeed += creature.baseAttackSpeed * 0.01
        }

        creature.eventHandlers[`flickerblade_${this.id}`] = onHit

        creature.on("afterAttack", onHit)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`flickerblade_${this.id}`]
        if (handler) {
            creature.off("afterAttack", handler)
            delete creature.eventHandlers[`flickerblade_${this.id}`]
        }
    }
}
