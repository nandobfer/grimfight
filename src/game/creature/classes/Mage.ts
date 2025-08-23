import { Explosion } from "../../fx/Explosion"
import { Fireball } from "../../objects/Fireball"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Mage extends Character {
    baseAttackSpeed = 0.5
    baseAttackDamage = 50
    baseAttackRange = 3
    baseManaPerSecond = 10
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
        const fireball = new Fireball(this)
        fireball.fire()
    }

    override castAbility(): void {
        this.casting = true
        this.anims.stop()

        // deals 2x attack damage to the target and 0.5x attack damage to nearby enemies
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

        const { damage, crit } = this.calculateDamage(this.attackDamage * 2)

        const finishSpell = () => {
            if (!this.target?.active) this.newTarget()

            this.target?.takeDamage(damage, this, "fire", { crit, type: "fire" })
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

        const explosion = new Explosion(this, this.target, this.attackDamage / 2)
        explosion.on("animationupdate", onAnimationUpdate)
        explosion.once("animationcomplete", cleanup)
        explosion.once("animationstop", cleanup)
    }
}
