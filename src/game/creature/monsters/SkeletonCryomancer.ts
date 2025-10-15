// src/game/characters/monsters/Skeleton.ts

import { IceShard } from "../../objects/Projectile/IceShard"
import { Game } from "../../scenes/Game"
import { Skeleton } from "./Skeleton"

export class SkeletonCryomancer extends Skeleton {
    baseMaxHealth = 375
    baseAttackDamage = 30
    baseAttackSpeed = 0.8
    baseAttackRange = 3

    constructor(scene: Game) {
        super(scene, "skeleton_cryomancer")
        this.preferredPosition = "middle"
        this.challengeRating = this.calculateCR()
    }

    override getAttackingAnimation(): string {
        return "attacking"
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 6
        this.extractAnimationsFromSpritesheet("attacking", 1, 6)
    }

    override landAttack(target = this.target) {
        if (!target || !this.active) return

        const projectile = new IceShard(this.scene, this.x, this.y, this).fire(target)
    }

    override castAbility(): void {
        if (!this.target || !this.active) return

        this.casting = true

        const shards = Math.floor(this.abilityPower * 0.1)

        for (let i = 1; i <= shards; i++) {
            const { x, y } = this.randomPointAround(false, true)
            const angle = Phaser.Math.Angle.Between(x, y, this.target.x, this.target.y)

            const shard = new IceShard(this.scene, x, y, this).setActive(true).setVisible(true).setRotation(angle)

            shard.onHit = (target) => {
                if (target) {
                    const damage = this.calculateDamage(this.abilityPower * 0.1)
                    target.takeDamage(damage.value, this, "cold", damage.crit)
                }

                shard.destroy(true)
            }

            this.scene.time.delayedCall(Phaser.Math.FloatBetween(200, 1500), () => {
                if (!this.target) {
                    shard.destroy(true)
                    return
                }

                shard.fire(this.target, x, y)
            })
        }

        this.casting = false
    }
}
