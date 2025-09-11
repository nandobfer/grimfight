import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Guinsoo extends Item {
    key = "guinsoo"
    name = "Lâmina da Fúria de Guinsoo"
    descriptionLines = ["+10% AP", "+15% AS", "Passiva: Recebe 3% AS ao atacar"]
    attackSpeedMultiplier = 0.03

    private baseline = new WeakMap<Creature, number>()
    private stacks = new WeakMap<Creature, number>()

    constructor(scene: Game) {
        super(scene, "item-guinsoo")
    }

    override applyModifier(creature: Creature): void {
        if (!this.stacks.has(creature)) this.stacks.set(creature, 0)
        creature.attackDamage *= 1 + 0.1
        creature.attackSpeed *= 1 + 0.15

        const previousHandler = creature.eventHandlers.guinsoo
        if (previousHandler) {
            creature.off("dealt-damage", previousHandler)
        }

        const onHit = (victim: Creature, damage: number) => {
            // capture baseline once (includes augments!)
            if (!this.baseline.has(creature)) {
                const base0 = creature.bonusAttackSpeed || creature.attackSpeed // fallback safety

                this.baseline.set(creature, base0)
            }
            const base = this.baseline.get(creature)!

            let stacks = this.stacks.get(creature) ?? 0
            stacks += 1
            this.stacks.set(creature, stacks)

            const multiplier = 1 + stacks * this.attackSpeedMultiplier
            creature.attackSpeed = base * multiplier

            if (creature.bonusAttackSpeed) creature.bonusAttackSpeed = base * multiplier
        }

        creature.eventHandlers.guinsoo = onHit

        creature.on("dealt-damage", onHit)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.guinsoo
        if (handler) {
            creature.off("dealt-damage", handler)
            delete creature.eventHandlers.guinsoo
        }
    }
}
