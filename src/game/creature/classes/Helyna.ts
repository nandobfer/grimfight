import { LightningBolt } from "../../objects/Lightningbolt"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Helyna extends Character {
    baseAttackSpeed = 1
    baseSpeed = 60
    baseAttackDamage = 20
    baseMaxMana: number = 0
    baseAbilityPower: number = 20
    manaLocked: boolean = true

    abilityDescription: string = `Se transforma em um animal, baseado na posição inicial, concedendo atributos e habilidades específicas para cada um.\n
    Urso (frente): Tamanho, armadura, vida e ataque aumentados. Ao lançar, conjura uma armadura de espinhos, aumentando sua armadura e causando dano a atacantes\n
    Gato (meio): Velocidade, velocidade de ataque e chance de crítico aumentados. ataca inimigos a sua frente\n
    Passarinho (atrás): `

    attacksCount = 0
    bonusAttackSpeed = 0
    bonusSpeed = 0
    missingHealthPercent = 1
    aura

    constructor(scene: Game, id: string) {
        super(scene, "statikk", id)

        this.aura = this.postFX.addGlow(0xddaa00, 0)
    }

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

    override reset(): void {
        super.reset()
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
