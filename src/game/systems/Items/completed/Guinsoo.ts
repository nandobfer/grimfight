import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Guinsoo extends Item {
    key = "guinsoo"
    name = "Lâmina da Fúria de Guinsoo"
    descriptionLines = ["+10% AP", "15% AS", "Passiva: Recebe 1% AS ao atacar"]

    private baseline = new WeakMap<Creature, number>()

    constructor(scene: Game) {
        super(scene, "item-guinsoo")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage *= 1 + 0.1
        creature.attackSpeed *= 1 + 0.15

        const previousHandler = creature.eventHandlers.guinsoo
        if (previousHandler) {
            creature.off("dealt-damage", previousHandler)
        }

        const onHit = (victim: Creature, damage: number) => {
            creature.attackSpeed *= 1 + 0.01
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
