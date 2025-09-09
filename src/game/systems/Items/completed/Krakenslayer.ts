import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Krakenslayer extends Item {
    key = "krakenslayer"
    name = "Mata Krakens"
    descriptionLines = ["+10% AD", "15% AS", "Passiva: Recebe 1% AD ao atacar"]

    constructor(scene: Game) {
        super(scene, "item-krakenslayer")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage *= 1 + 0.1
        creature.attackSpeed *= 1 + 0.15

        const previousHandler = creature.eventHandlers.krakenslayer
        if (previousHandler) {
            creature.off("dealt-damage", previousHandler)
        }

        const onHit = (victim: Creature, damage: number) => {
            creature.attackDamage *= 1 + 0.01
        }

        creature.eventHandlers.krakenslayer = onHit

        creature.on("dealt-damage", onHit)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.krakenslayer
        if (handler) {
            creature.off("dealt-damage", handler)
            delete creature.eventHandlers.krakenslayer
        }
    }
}
