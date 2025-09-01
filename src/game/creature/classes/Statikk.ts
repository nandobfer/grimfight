import { LightningBolt } from "../../objects/Lightningbolt"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Statikk extends Character {
    baseAttackSpeed = 1.2
    baseSpeed = 80
    baseAttackDamage = 20
    baseMaxMana: number = 0
    baseAbilityPower: number = 20
    manaLocked: boolean = true

    abilityName: string = "Fúria de Guinsoo"

    attacksCount = 0
    bonusAttackSpeed = 0
    bonusSpeed = 0
    missingHealthPercent = 1
    aura

    constructor(scene: Game, id: string) {
        super(scene, "statikk", id)

        this.aura = this.postFX.addGlow(0xddaa00, 0)
    }

    override getAbilityDescription(): string {
        return `Cada [primary.main:3º ataque] lança uma cadeia de raios no alvo, causando [info.main:${Math.round(
            this.abilityPower * 1.2
        )} (120% AP)] de dano e se propaga 5x, causando dano reduzido a cada propagação
Além disso, ganha velocidade de ataque bônus equivalente a porcentagem de vida perdida.`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 3
        const attacking = this.extractAnimationsFromSpritesheet("attacking2", 1, 5, 13, "statikk_attacking")
        const specialAttacking = this.extractAnimationsFromSpritesheet("attacking1", 52, 6, 13, "statikk_attacking")

        console.log(this.width / 2, this.height / 2)
        const onUpdate = (animation: Phaser.Animations.Animation) => {
            if ([...attacking, ...specialAttacking].find((anim) => anim.key === animation.key)) {
                this.setOrigin(0.5, 0.6)
            } else {
                this.setOrigin(0.5, 0.75)
            }
        }

        this.on("animationstart", onUpdate)
        this.once("destroy", () => this.off("animationstart", onUpdate))
    }

    override landAttack(): void {
        super.landAttack()
        this.attacksCount += 1

        if (!this.target) {
            return
        }

        if (this.attacksCount === 3) {
            this.attacksCount = 0

            const lightning = new LightningBolt(this, this.abilityPower * 1.2)
            lightning.fire(this.target)
        }
    }

    scaleSpeedWithLife() {
        this.missingHealthPercent = this.multFromHealth()

        this.attackSpeed = this.bonusAttackSpeed * this.missingHealthPercent
        this.speed = this.bonusSpeed * this.missingHealthPercent

        this.aura.outerStrength = (this.missingHealthPercent - 1) * 1.5
    }

    private multFromHealth(): number {
        if (this.maxHealth <= 0) return 1
        // 1 at full HP → 2 at 0 HP
        const m = 2 - this.health / this.maxHealth
        return Phaser.Math.Clamp(m, 1, 2)
    }

    override refreshStats(): void {
        super.refreshStats()
        this.attacksCount = 0
        this.bonusAttackSpeed = this.attackSpeed
        this.bonusSpeed = this.speed
        this.missingHealthPercent = 1
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)

        if (this.active) {
            this.scaleSpeedWithLife()
        }
    }
}
