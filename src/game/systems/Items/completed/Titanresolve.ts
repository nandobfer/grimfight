import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Titanresolve extends Item {
    key = "titanresolve"
    name = "Resolução Titânica"
    descriptionLines = [
        "+10% AS",
        "5% resistência",
        "Passiva: Ganha 1% AD e AP ao receber dano, acumulando até 25 vezes. Com máximo de acúmulos, ganha 10% resistência.",
    ]
    stacks = 0

    constructor(scene: Game) {
        super(scene, "item-titanresolve")
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed *= 1 + 0.1
        creature.resistance += 5
        this.stacks = 0

        const previousHandler = creature.eventHandlers.titanresolve
        if (previousHandler) {
            creature.off("damage-taken", previousHandler)
        }

        const onHit = (damage: number) => {
            if (this.stacks < 25) {
                this.stacks += 1
                creature.attackDamage *= 1 + 0.01
                creature.abilityPower *= 1 + 0.01
            } else {
                creature.setScale(creature.scale * 1.5)
                creature.resistance += 10
                creature.off("damage-taken", onHit)
            }
        }

        creature.eventHandlers.titanresolve = onHit

        creature.on("damage-taken", onHit)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.titanresolve
        if (handler) {
            creature.off("damage-taken", handler)
            delete creature.eventHandlers.titanresolve
        }
    }
}
