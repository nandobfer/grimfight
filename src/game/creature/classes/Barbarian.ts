import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Barbarian extends Character {
    baseMaxHealth = 550
    baseAttackDamage = 25
    baseMaxMana = 130
    baseAttackSpeed: number = 1.15
    baseAbilityPower: number = 25

    abilityName: string = "Vigor"

    constructor(scene: Game, id: string) {
        super(scene, "grok", id)
    }

    override getAbilityDescription(): string {
        return `Recupera [success.main:${Math.round(this.getHealValue())} (12% HP perdido)] [info.main:(200% AP)] pontos de vida.`
    }

    getHealValue() {
        return (1 - this.health / this.maxHealth) * 0.12 * this.maxHealth + this.abilityPower * 2
    }

    castAbility(): void {
        this.casting = true
        const { value: healing, crit } = this.calculateDamage(this.getHealValue())
        this.heal(healing, crit)

        this.casting = false
    }
}
