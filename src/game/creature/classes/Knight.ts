import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Knight extends Character {
    baseMaxHealth = 500
    baseArmor = 5
    baseResistance = 10
    baseAttackDamage = 13
    baseMaxMana = 130

    constructor(scene: Game, id: string) {
        super(scene, "knight", id)
    }

    castAbility(): void {
        this.casting = true
        const { damage: healing, crit } = this.calculateDamage(this.maxHealth * 0.1 + this.abilityPower)
        this.heal(healing, crit)
        this.casting = false
    }
}
