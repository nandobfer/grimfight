import { IceShard } from "../../objects/Projectile/IceShard"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Reno extends Character {
    baseAttackSpeed = 0.75
    baseAttackDamage = 35
    baseAttackRange = 5
    baseManaPerSecond = 0
    baseMaxHealth = 300

    baseMaxMana = 0
    manaLocked = true

    abilityName: string = "Dedos Congelados"

    attacksCount = 0
    lastAttackSpeed = 0

    constructor(scene: Game, id: string) {
        super(scene, "reno", id)
        this.setTint(0x0000ff)
    }

    override getAbilityDescription(): string {
        return `Passivo: Cada [primary.main:5º ataque] causa [info.main:${Math.round(this.abilityPower)} (100% AP)] dano adicional.
    
Passivo: Sua velocidade de ataque é travada em [warning.main:${
            this.baseAttackSpeed
        }/s], porém converte toda velocidade bônus em AD. Bônus atual: [error.main:${Math.round(
            this.getAsMultiplier() * this.attackDamage
        )}%] [warning.main:(${Math.round(this.getAsMultiplier() * 100)}% AS bônus)]`
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

        if (this.attacksCount === 5) {
            this.attacksCount = 0
            this.makeBigShot(iceshard)
        }

        iceshard.fire(this.target)
    }

    // criar um tipo de lamina giratoria? glaive? pegar sprite?
    makeBigShot(projectile: IceShard) {
        projectile.scaleX = projectile.scale * 2
        projectile.speed += 300
        this.scene.tweens.add({ targets: projectile, duration: 30, angle: 360, repeat: -1, yoyo: false })

        projectile.onHit = (target) => {
            const { value: damage, crit: isCrit } = this.calculateDamage(this.attackDamage + this.abilityPower)

            target.gainMana(target.manaOnHit)
            target.takeDamage(damage, this, "cold", isCrit)
            this.gainMana(this.manaPerAttack)
            this.emit("afterAttack")
        }
    }

    scaleAdFromAs() {
        const multiplier = this.getAsMultiplier()
        this.attackDamage *= 1 + multiplier
        this.lastAttackSpeed = this.attackSpeed
    }

    getAsMultiplier() {
        return 1 - this.attackSpeed / this.baseAttackSpeed
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
