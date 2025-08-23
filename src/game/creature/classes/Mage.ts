import { Explosion } from "../../fx/Explosion"
import { Fireball } from "../../objects/Fireball"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Mage extends Character {
    baseAttackSpeed = 0.5
    baseAttackRange = 3
    baseManaPerSecond = 10
    baseMaxMana = 50
    baseMaxHealth = 200

    constructor(scene: Game, id: string) {
        super(scene, "mage", id)
        this.attackAnimationImpactFrame = 6
    }

    override extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking1", 1, 6)
        this.extractAnimationsFromSpritesheet("attacking2", 1, 6)

        this.extractAnimationsFromSpritesheet("casting", 208, 13)
    }

    // levelUp(): void {
    //     super.levelUp()

    //     this.baseAttackDamage += 10
    // }

    override landAttack() {
        if (!this.target) return

        const fireball = new Fireball(this)
        fireball.fire(this.target)
    }

    override castAbility(): void {
        this.casting = true
        this.anims.stop()

        // deals 2x ability power to the target and 0.5x ability power to nearby enemies
        this.explodeTarget()
    }

    explodeTarget() {
        if (!this.target?.active) {
            this.newTarget()
            this.explodeTarget()
            return
        }

        if (!this.target?.active) {
        }

        const { damage, crit } = this.calculateDamage(this.abilityPower * 2)

        const finishSpell = () => {
            if (!this.target?.active) this.newTarget()

            this.target?.takeDamage(damage, this, { crit, type: "fire" })
            this.casting = false
        }

        const onAnimationUpdate = (animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
            if (animation.key !== "explosion") return

            if (frame.index === 3) {
                finishSpell()
            }
        }

        const cleanup = () => {
            explosion.off("animationupdate", onAnimationUpdate)
            explosion.cleanup()
            this.casting = false
        }

        const explosion = new Explosion(this, this.target, this.abilityPower / 2, 2.5)
        explosion.on("animationupdate", onAnimationUpdate)
        explosion.once("animationcomplete", cleanup)
        explosion.once("animationstop", cleanup)
    }
}
