import type { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { applyThresholdUntargetable, cleanupThresholdUntargetable } from "../../Combat/ThresholdUntargetable"
import { Item } from "../Item"

export class Nightedge extends Item {
    key = "nightedge"
    name = "Night Edge"
    descriptionLines = ["+15% AD", "+5% armor", "Passive: Upon falling to 60% health for the first time, becomes briefly untargetable"]

    constructor(scene: Game) {
        super(scene, "item-nightedge")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage += creature.baseAttackDamage * 0.15
        creature.armor += 5

        applyThresholdUntargetable(creature, {
            key: this.thresholdKey,
            threshold: 0.6,
            duration: 3000,
            source: this.name,
        })
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        cleanupThresholdUntargetable(creature, this.thresholdKey)
    }

    private get thresholdKey() {
        return `nightedge_${this.id}`
    }
}
