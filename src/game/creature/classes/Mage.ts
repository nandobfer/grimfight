import { Explosion } from "../../fx/Explosion"
import { Fireball } from "../../objects/Fireball"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Mage extends Character {
    baseAttackSpeed = 0.5
    baseAttackRange = 3
    baseManaPerSecond = 10
    baseMaxMana = 60
    baseMaxHealth = 200
    baseAbilityPower: number = 50

    abilityName = "Explosão"

    constructor(scene: Game, id: string) {
        super(scene, "megumin", id)
    }

    override getAbilityDescription(): string {
        return `Explode o alvo atual, causando [info.main:${Math.round(this.abilityPower * 2)} (200% AP)] de dano, além de [info.main:${Math.round(
            this.abilityPower * 0.5
        )} (50% AP)] aos inimigos adjacentes.`
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
        if (!this.target) return

        const fireball = new Fireball(this)
        fireball.fire(this.target)
    }

    override castAbility(multiplier = 1): void {
        if (!this.target) return

        this.casting = true
        const { value: damage, crit } = this.calculateDamage(this.abilityPower * 2 * multiplier)

        this.target.takeDamage(damage, this, "fire", crit)
        new Explosion(this, this.target, this.abilityPower / 2, 2.5)

        this.casting = false
    }
}
