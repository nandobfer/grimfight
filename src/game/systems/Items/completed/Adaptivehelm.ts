import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Adaptivehelm extends Item {
    key = "adaptivehelm"
    name = "Adaptive Elm"
    descriptionLines = [
        "+3 mana/s",
        "Passive: Gains a bonus based on the starting position:",
        "Front: +10% armor and +2 mana when attacked",
        "Middle: +5% AD and AP, +5% armor and +1 mana per attack and when attacked",
        "Back: +10% AD and AP and +2 mana per attack",
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
