import { IceShard } from "../../objects/Projectile/IceShard"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Reno extends Character {
    baseAttackSpeed = 0.75
    baseAttackDamage = 50
    baseAttackRange = 5
    baseManaPerSecond = 0
    baseMaxHealth = 300

    baseMaxMana = 0
    manaLocked = true

    abilityName: string = "Frozen Fingers"

    attacksCount = 0
    lastAttackSpeed = 0

    constructor(scene: Game, id: string) {
        super(scene, "reno", id)
    }

    override getAbilityDescription(): string {
        return `Passive: Every [primary.main:5th attack] deals [info.main:${Math.round(this.abilityPower)} (100% AP)] additional damage.

Passive: Your attack speed is locked at [warning.main:${
            this.baseAttackSpeed
        }/s], but converts all bonus speed into AD. Current bonus: [error.main:${Math.round(
            this.getAsMultiplier() * this.attackDamage
        )}%] [warning.main:(${Math.round(this.getAsMultiplier() * 100)}% bonus AS)]`
    }

    override getAttackingAnimation(): string {
        return `attacking`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 6
        this.extractAnimationsFromSpritesheet("attacking", 52, 8)
    }

    override landAttack() {
        if (!this.target || !this?.active) return

        this.attacksCount += 1

        const iceshard = new IceShard(this.scene, this.x, this.y, this, 500)
        iceshard.damageType = "normal"

        if (this.attacksCount === 4) {
            this.glowTemporarily(0x99ddff, 1, 1500)
        }

        if (this.attacksCount === 5) {
            this.attacksCount = 0
            this.makeBigShot(iceshard)
        }

        iceshard.fire(this.target)
    }

    // criar um tipo de lamina giratoria? glaive? pegar sprite?
    makeBigShot(projectile: IceShard) {
        projectile.setScale(projectile.scale * 5)
        projectile.speed += 300
        // this.scene.tweens.add({ targets: projectile, duration: 30, angle: 360, repeat: -1, yoyo: false })

        projectile.onHit = (target) => {
            const { value: damage, crit: isCrit } = this.calculateDamage(this.attackDamage + this.abilityPower)

            target.takeDamage(damage, this, "cold", isCrit)
            this.onHit(target)
        }
    }

    scaleAdFromAs() {
        const multiplier = this.getAsMultiplier()
        this.attackDamage *= 1 + multiplier
        this.lastAttackSpeed = this.attackSpeed
    }

    getAsMultiplier() {
        return this.attackSpeed / this.baseAttackSpeed - 1
    }

    override getAttackingSpeed(): number {
        return this.baseAttackSpeed
    }

    override refreshStats(): void {
        super.refreshStats()
        this.manaLocked = true
        this.attacksCount = 0
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)

        if (this.attackSpeed !== this.lastAttackSpeed) {
            this.scaleAdFromAs()
        }
    }
}
