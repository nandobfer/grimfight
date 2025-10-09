import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class SeekersArmGuard extends Item {
    key = "seekersarmguard"
    name = "Seeker's Arm Guard"
    descriptionLines = [
        "+30% AP",
        "+10% Armor",
        "Passive: Killing an enemy grants 10% AP and 7% armor.",
    ]

    constructor(scene: Game) {
        super(scene, "item-seekersarmguard")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatPercent("abilityPower", 30)
        creature.addStatValue("armor", 10)

        const previousHandler = creature.eventHandlers[`seekersarmguard_${this.id}`]
        if (previousHandler) {
            creature.off("kill", previousHandler)
        }

        const onKill = (victim: Creature) => {
            creature.addStatPercent("abilityPower", 10)
            creature.addStatPercent("armor", 7)
        }

        creature.eventHandlers[`seekersarmguard_${this.id}`] = onKill

        creature.on("kill", onKill)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`seekersarmguard_${this.id}`]
        if (handler) {
            creature.off("kill", handler)
            delete creature.eventHandlers[`seekersarmguard_${this.id}`]
        }
    }
}
