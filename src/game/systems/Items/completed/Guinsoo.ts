import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Guinsoo extends Item {
    key = "guinsoo"
    name = "Lâmina da Fúria de Guinsoo"
    descriptionLines = ["+10% AP", "+15% AS", "Passiva: Recebe 3% AS ao atacar"]
    attackSpeedMultiplier = 0.03

    constructor(scene: Game) {
        super(scene, "item-guinsoo")
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower += creature.baseAbilityPower * 0.1
        creature.attackSpeed += creature.baseAttackSpeed * 0.15

        const previousHandler = creature.eventHandlers[`guinsoo_${this.id}`]
        if (previousHandler) {
            creature.off("afterAttack", previousHandler)
        }

        const onHit = (victim: Creature, damage: number) => {
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
