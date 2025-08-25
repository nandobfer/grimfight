import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Barbarian extends Character {
    baseMaxHealth = 500
    baseAttackDamage = 25
    baseMaxMana = 130

    constructor(scene: Game, id: string) {
        super(scene, "barbarian", id)
    }

    castAbility(): void {
        this.casting = true
        const { damage: healing, crit } = this.calculateDamage(this.maxHealth * 0.07 + this.abilityPower)
        this.heal(healing, crit)

        this.casting = false
    }
}
