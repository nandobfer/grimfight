import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Hextechgunblade extends Item {
    key = "hextechgunblade"
    name = "Pistolar Laminar Hextech"
    descriptionLines = ["+20% AD", "+20% AP", "Passiva: Cura o aliado com a menor porcentagem de vida em 20% do dano causado"]

    constructor(scene: Game) {
        super(scene, "item-hextechgunblade")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage *= 1 + 0.2
        creature.abilityPower *= 1 + 0.2

        const previousHandler = creature.eventHandlers.hextechgunblade
        if (previousHandler) {
            creature.off("dealt-damage", previousHandler)
        }

        const healFriend = (victim: Creature, damage: number) => {
            const friend = creature.team.getLowestHealth()
            friend?.heal(damage * 0.2)
        }

        creature.eventHandlers.hextechgunblade = healFriend

        creature.on("dealt-damage", healFriend)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.hextechgunblade
        if (handler) {
            creature.off("dealt-damage", handler)
            delete creature.eventHandlers.hextechgunblade
        }
    }
}
