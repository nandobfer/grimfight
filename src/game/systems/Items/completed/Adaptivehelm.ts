import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Adaptivehelm extends Item {
    key = "adaptivehelm"
    name = "Elmo Adaptativo"
    descriptionLines = [
        "+3 mana/s",
        "Passiva: Ganha bônus baseado na posição inicial:",
        "Frente: +10% armadura e +2 mana ao ser atacado",
        "Meio: +5% AD e AP, +5% armadura e +1 de mana por ataque e ao ser atacado",
        "Trás: +10% AD e AP e +2 de mana por ataque",
    ]

    constructor(scene: Game) {
        super(scene, "item-adaptivehelm")
    }

    override applyModifier(creature: Creature): void {
        creature.manaPerSecond += 3

        const placement = creature.getPlacement()

        switch (placement) {
            case "front": {
                creature.armor += 10
                creature.manaOnHit += 2
                break
            }
            case "middle": {
                creature.attackDamage += 0.05 * creature.baseAttackDamage
                creature.abilityPower += 0.05 * creature.baseAbilityPower
                creature.armor += 5
                creature.manaOnHit += 1
                creature.manaPerAttack += 1
                break
            }
            case "back": {
                creature.attackDamage += 0.1 * creature.baseAttackDamage
                creature.abilityPower += 0.1 * creature.baseAbilityPower
                creature.manaPerAttack += 2
                break
            }
        }
    }
}
