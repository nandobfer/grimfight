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
        super(scene, "jadis", id)
    }

    override getAbilityDescription(): string {
        return `Passivo: Cada [primary.main:4º ataque] causa [info.main:${Math.round(this.abilityPower)} (100% AP)] dano adicional.
    
    Passivo: Sua velocidade de ataque é travada, porém converte toda velocidade bônus em AD. Bônus atual: [error.main:${Math.round(
        this.getAsMultiplier() * this.attackDamage
    )}%] [warning.main:(${Math.round(this.getAsMultiplier() * 100)}% AS)]`
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

        if (this.attacksCount === 4) {
            this.attacksCount = 0
            this.makeFourthShot(iceshard)
        }

        iceshard.fire(this.target)
    }

    makeFourthShot(projectile: IceShard) {
        projectile.setScale(projectile.scale * 1.5)

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
        return this.attackSpeed / this.baseAttackSpeed
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
