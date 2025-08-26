import { LightningBolt } from "../../objects/Lightningbolt"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Statikk extends Character {
    baseAttackSpeed = 1.25
    baseSpeed = 80
    baseAttackDamage = 20
    baseMaxMana: number = 0
    // baseMaxMana: number = 50
    baseAbilityPower: number = 20
    manaLocked: boolean = true

    abilityDescription: string = "Passivo: Cada 3º ataque lança uma cadeia de raios no alvo, que se propaga e causa dano reduzido a cada propagação"
    // abilityDescription: string = "Aplica um acúmulo de veneno no alvo"

    attacksCount = 0
    bonusAttackSpeed = 0
    missingHealthPercent = 1
    aura

    constructor(scene: Game, id: string) {
        super(scene, "statikk", id)

        this.aura = this.postFX.addGlow(0xddaa00, 0)
    }

    // override getAttackingAnimation(): string {
    //     // this.attackAnimationImpactFrame = this.attacksCount === 2 ? 3 : 5
    //     // return this.attacksCount === 2 ? "attacking-special" : `attacking`
    //     return "attacking"
    // }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 3
        const attacking = this.extractAnimationsFromSpritesheet("attacking2", 1, 5, 13, "statikk_attacking")
        const specialAttacking = this.extractAnimationsFromSpritesheet("attacking1", 52, 6, 13, "statikk_attacking")

        console.log(this.width / 2, this.height / 2)
        const onUpdate = (animation: Phaser.Animations.Animation) => {
            if ([...attacking, ...specialAttacking].find((anim) => anim.key === animation.key)) {
                this.setOffset(this.width / 4, this.height / 4)
            } else {
                this.setOffset(0, 0)
            }
        }

        this.on("animationstart", onUpdate)
    }

    override landAttack(): void {
        super.landAttack()
        this.attacksCount += 1

        if (!this.target) {
            return
        }

        if (this.attacksCount === 3) {
            this.attacksCount = 0

            const lightning = new LightningBolt(this, this.abilityPower)
            lightning.fire(this.target)
        }
    }

    scaleSpeedWithLife() {
        this.missingHealthPercent = 2 - this.health / this.maxHealth
        this.attackSpeed = this.baseAttackSpeed * this.bonusAttackSpeed * this.missingHealthPercent
        this.aura.outerStrength = (this.missingHealthPercent - 1) * 1.5

    }

    override reset(): void {
        super.reset()
        this.attacksCount = 0
        this.bonusAttackSpeed = this.attackSpeed
        this.missingHealthPercent = 1
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)

        if (this.active) {
            this.scaleSpeedWithLife()
        }
    }
}
