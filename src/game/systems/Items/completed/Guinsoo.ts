import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Guinsoo extends Item {
    key = "guinsoo"
    name = "Lâmina da Fúria de Guinsoo"
    descriptionLines = ["+10% AP", "+15% AS", "Passiva: Recebe 3% AS ao atacar"]
    attackSpeedMultiplier = 0.03

    private baseline = 0
    private stacks = 0

    constructor(scene: Game) {
        super(scene, "item-guinsoo")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage *= 1 + 0.1
        creature.attackSpeed *= 1 + 0.15

        const previousHandler = creature.eventHandlers[`guinsoo_${this.id}`]
        if (previousHandler) {
            creature.off("dealt-damage", previousHandler)
        }

        const onHit = (victim: Creature, damage: number) => {
            // capture baseline once
            if (!this.baseline) {
                this.baseline = creature.bonusAttackSpeed || creature.attackSpeed
            }

            this.stacks += 1

            const multiplier = 1 + this.stacks * this.attackSpeedMultiplier
            creature.attackSpeed = this.baseline * multiplier

            if (creature.bonusAttackSpeed) creature.bonusAttackSpeed = this.baseline * multiplier
        }

        creature.eventHandlers[`guinsoo_${this.id}`] = onHit

        creature.on("dealt-damage", onHit)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`guinsoo_${this.id}`]
        if (handler) {
            creature.off("dealt-damage", handler)
            delete creature.eventHandlers[`guinsoo_${this.id}`]
        }
        this.stacks = 0
        this.baseline = 0
    }
}
