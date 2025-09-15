import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Voidstaff extends Item {
    key = "voidstaff"
    name = "Void Staff"
    descriptionLines = ["+10% AS", "+3 mana/s", "Passive: Drains 2 mana from the enemy when attacking."]

    constructor(scene: Game) {
        super(scene, "item-voidstaff")
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed += creature.baseAttackSpeed * 0.1
        creature.manaPerSecond += 3

        const previousHandler = creature.eventHandlers[`voidstaff_${this.id}`]
        if (previousHandler) {
            creature.off("afterAttack", previousHandler)
        }

        const drainMana = (victim: Creature) => {
            const manaToDrain = 2
            victim.gainMana(-manaToDrain)
            creature.gainMana(manaToDrain)
        }

        creature.eventHandlers[`voidstaff_${this.id}`] = drainMana

        creature.on("afterAttack", drainMana)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`voidstaff_${this.id}`]
        if (handler) {
            creature.off("afterAttack", handler)
            delete creature.eventHandlers[`voidstaff_${this.id}`]
        }
    }
}
