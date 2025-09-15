import { Explosion } from "../../fx/Explosion"
import { Fireball } from "../../objects/Projectile/Fireball"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Mage extends Character {
    baseAttackSpeed = 0.5
    baseAttackRange = 3
    baseManaPerSecond = 10
    baseMaxMana = 120
    baseMaxHealth = 220

    abilityName = "Explosion"

    constructor(scene: Game, id: string) {
        super(scene, "megumin", id)
    }

    override getAbilityDescription(): string {
        return `Explodes the current target, dealing [info.main:${Math.round(this.abilityPower * 3)} (300% AP)] damage, plus [info.main:${Math.round(
            this.abilityPower
        )} (100% AP)] to adjacent enemies.`
    }

    override getAttackingAnimation(): string {
        return `attacking`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 6
        this.extractAnimationsFromSpritesheet("attacking", 1, 6)
        this.extractAnimationsFromSpritesheet("casting", 208, 13)
    }

    override landAttack() {
        if (!this.target || !this?.active) return

        const fireball = new Fireball(this.scene, this.x, this.y, this)
        fireball.fire(this.target)
    }

    override castAbility(multiplier = 1): void {
        if (!this.target) return

        this.casting = true
        const { value: damage, crit } = this.calculateDamage(this.abilityPower * 3 * multiplier)

        try {
            this.target.takeDamage(damage, this, "fire", crit)
            new Explosion(this, this.target, this.abilityPower, 2.5)
        } catch (error) {
            console.log(error)
        }

        this.casting = false
    }

    override refreshStats(): void {
        super.refreshStats()
        this.mana = this.maxMana * 0.65
    }
}
