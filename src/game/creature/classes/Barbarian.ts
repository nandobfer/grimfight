import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Barbarian extends Character {
    baseMaxHealth = 550
    baseAttackDamage = 25
    baseMaxMana = 130
    baseAttackSpeed: number = 1.15
    baseAbilityPower: number = 25

    abilityDescription: string = "Cura uma porcentagem da vida faltante"

    constructor(scene: Game, id: string) {
        super(scene, "barbarian", id)
    }

    castAbility(): void {
        this.casting = true
        const { damage: healing, crit } = this.calculateDamage((1 - this.health / this.maxHealth) * 0.12 * this.maxHealth + this.abilityPower * 2)
        this.heal(healing, crit)

        this.casting = false
    }
}
