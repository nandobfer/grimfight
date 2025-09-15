import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Titanresolve extends Item {
    key = "titanresolve"
    name = "Titan's Resolve"
    descriptionLines = [
    "+10% AS",
    "+5% armor",
    "Passive: Gains 1% AD and AP when receiving damage, stacking up to 25 times. At maximum stacks, gains 10% armor."
]
    stacks = 0

    constructor(scene: Game) {
        super(scene, "item-titanresolve")
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed += creature.baseAttackSpeed * 0.1
        creature.armor += 5
        this.stacks = 0

        const previousHandler = creature.eventHandlers[`titanresolve_${this.id}`]
        if (previousHandler) {
            creature.off("damage-taken", previousHandler)
        }

        const onHit = (damage: number) => {
            if (this.stacks < 25) {
                this.stacks += 1
                creature.attackDamage += creature.baseAttackDamage * 0.01
                creature.abilityPower += creature.baseAbilityPower * 0.01
            } else {
                creature.scale += creature.baseScale * 0.5
                creature.armor += 10
                creature.off("damage-taken", onHit)
            }
        }

        creature.eventHandlers[`titanresolve_${this.id}`] = onHit

        creature.on("damage-taken", onHit)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`titanresolve_${this.id}`]
        if (handler) {
            creature.off("damage-taken", handler)
            delete creature.eventHandlers[`titanresolve_${this.id}`]
        }
    }
}
