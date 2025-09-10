import { LightningBolt } from "../../objects/Lightningbolt"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Statikk extends Character {
    baseMaxHealth: number = 400
    baseAttackSpeed = 1.2
    baseAttackDamage = 20
    baseMaxMana: number = 0
    manaLocked: boolean = true

    abilityName: string = "Fúria de Guinsoo"

    attacksCount = 0

    constructor(scene: Game, id: string) {
        super(scene, "statikk", id)
    }

    override getAbilityDescription(): string {
        return `Cada [primary.main:3º ataque] lança uma cadeia de raios no alvo, causando [info.main:${Math.round(
            this.abilityPower * 0.75
        )} (75% AP)] de dano e se propaga 5x, causando dano reduzido a cada propagação`
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

            const lightning = new LightningBolt(this, this.abilityPower * 0.75, 5)
            lightning.fire(this.target)
        }
    }

    override refreshStats(): void {
        super.refreshStats()
        this.attacksCount = 0
    }
}
