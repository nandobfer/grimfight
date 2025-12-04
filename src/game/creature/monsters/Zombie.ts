import { Game } from "../../scenes/Game"
import { Monster } from "./Monster"

export class Zombie extends Monster {
    baseMaxHealth = 750
    baseAttackDamage = 30
    baseAttackSpeed = 0.5
    baseMaxMana = 130

    constructor(scene: Game) {
        super(scene, "zombie")
        this.preferredPosition = "front"
        this.challengeRating = this.calculateCR()
    }

    castAbility(): void {
        this.casting = true

        if (this.target) {
            const { value: damage, crit } = this.calculateDamage(this.abilityPower * 1.3)
            this.target.takeDamage(damage, this, "poison", crit)
            this.heal(damage * 2)
        }

        this.casting = false
    }
}
