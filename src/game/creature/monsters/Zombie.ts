import { Game } from "../../scenes/Game";
import { Monster } from "./Monster";

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
            const { damage, crit } = this.calculateDamage(this.attackDamage * 2)
            this.target.takeDamage(damage, this, 'poison', crit)
            this.heal(damage, crit)
        }

        this.casting = false
    }
}