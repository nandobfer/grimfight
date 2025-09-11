import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Voidstaff extends Item {
    key = "voidstaff"
    name = "Cajado do Vazio"
    descriptionLines = ["+10% AS", "+20% mana/s", "Passiva: Drena 2 mana do inimigo ao atacar."]

    constructor(scene: Game) {
        super(scene, "item-voidstaff")
    }

    override applyModifier(creature: Creature): void {
        creature.attackSpeed *= 1 + 0.1
        creature.manaPerSecond *= 1 + 0.2

        const previousHandler = creature.eventHandlers[`voidstaff_${this.id}`]
        if (previousHandler) {
            creature.off("dealt-damage", previousHandler)
        }

        const drainMana = (victim: Creature, damage: number) => {
            const manaToDrain = 2
            victim.gainMana(-manaToDrain)
            creature.gainMana(manaToDrain)
        }

        creature.eventHandlers[`voidstaff_${this.id}`] = drainMana

        creature.on("dealt-damage", drainMana)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`voidstaff_${this.id}`]
        if (handler) {
            creature.off("dealt-damage", handler)
            delete creature.eventHandlers[`voidstaff_${this.id}`]
        }
    }
}
