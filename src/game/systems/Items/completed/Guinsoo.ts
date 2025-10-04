import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Guinsoo extends Item {
    key = "guinsoo"
    name = "Guinsoo's Rage Blade"
    descriptionLines = ["+35% AS", "Passive: Gains 1.5% AS when attacking"]
    attackSpeedMultiplier = 0.015

    constructor(scene: Game) {
        super(scene, "item-guinsoo")
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed += creature.baseAttackSpeed * 0.35

        const previousHandler = creature.eventHandlers[`guinsoo_${this.id}`]
        if (previousHandler) {
            creature.off("afterAttack", previousHandler)
        }

        const onHit = (victim: Creature) => {
            const bonusValue = creature.baseAttackSpeed * this.attackSpeedMultiplier
            creature.attackSpeed += bonusValue
            if (creature.bonusAttackSpeed) creature.bonusAttackSpeed += bonusValue
        }

        creature.eventHandlers[`guinsoo_${this.id}`] = onHit

        creature.on("afterAttack", onHit)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`guinsoo_${this.id}`]
        if (handler) {
            creature.off("afterAttack", handler)
            delete creature.eventHandlers[`guinsoo_${this.id}`]
        }
    }
}
