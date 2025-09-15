import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Krakenslayer extends Item {
    key = "krakenslayer"
    name = "Krakenslayer"
    descriptionLines = ["+10% AD", "+15% AS", "Passive: Gains 2% AD when attacking"]

    constructor(scene: Game) {
        super(scene, "item-krakenslayer")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage += creature.baseAttackDamage * 0.1
        creature.attackSpeed += creature.baseAttackSpeed * 0.15

        const previousHandler = creature.eventHandlers[`krakenslayer_${this.id}`]
        if (previousHandler) {
            creature.off("afterAttack", previousHandler)
        }

        const onHit = (victim: Creature) => {
            creature.attackDamage += creature.baseAttackDamage * 0.02
        }

        creature.eventHandlers[`krakenslayer_${this.id}`] = onHit

        creature.on("afterAttack", onHit)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`krakenslayer_${this.id}`]
        if (handler) {
            creature.off("afterAttack", handler)
            delete creature.eventHandlers[`krakenslayer_${this.id}`]
        }
    }
}
