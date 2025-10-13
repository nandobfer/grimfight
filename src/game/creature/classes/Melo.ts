import { HolyHeal } from "../../fx/HolyHeal"
import { Holybolt } from "../../objects/Projectile/Holybolt"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Melo extends Character {
    baseAttackSpeed = 0.5
    baseAttackRange = 3
    baseManaPerSecond = 10
    baseMaxMana = 120
    baseMaxHealth = 220

    abilityName = "Healing Prayer"

    constructor(scene: Game, id: string) {
        super(scene, "melo", id)
    }

    override getAbilityDescription(): string {
        return `Heals the 3 allies with the lowest health for [info.main:${Math.round(this.abilityPower * 1)} (100% AP)]`
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

        new Holybolt(this.scene, this.x, this.y, this).fire(this.target)
    }

    override castAbility(): void {
        if (!this.target) return

        this.casting = true

        try {
            const targets = [...this.team.getChildren(true, true)].sort((a, b) => a.health / a.maxHealth - b.health / b.maxHealth).slice(0, 3)

            targets.forEach((target) => {
                const { value } = this.calculateDamage(this.abilityPower)
                target.heal(value, { healer: this, source: this.abilityName })
                new HolyHeal(this.scene, target.x, target.y, 0.7)
            })
        } catch (error) {
            console.log(error)
        }

        this.casting = false
    }

    override refreshStats(): void {
        super.refreshStats()
        this.mana = this.maxMana * 0.35
    }
}
