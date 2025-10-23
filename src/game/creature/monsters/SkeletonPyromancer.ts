// src/game/characters/monsters/Skeleton.ts

import { ExplosivePumpkinFx } from "../../fx/ExplosivePumpkinFx"
import { Fireball } from "../../objects/Projectile/Fireball"
import { Game } from "../../scenes/Game"
import { Skeleton } from "./Skeleton"

export class SkeletonPyromancer extends Skeleton {
    baseMaxHealth = 400
    baseAttackDamage = 30
    baseAttackSpeed = 0.75
    baseAttackRange = 2

    abilityName = "Explosive Pumpkin"

    constructor(scene: Game) {
        super(scene, "skeleton_pyromancer")
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

        const projectile = new Fireball(this.scene, this.x, this.y, this).fire(target)
    }

    override castAbility(): void {
        if (!this.target || !this.active) return

        this.casting = true

        const randomPositionAroundTarget = this.target.randomPointAround()

        const pumpkin = new ExplosivePumpkinFx(this.scene, randomPositionAroundTarget.x, randomPositionAroundTarget.y, 1)
        pumpkin.onExplode = () => {
            const enemyTeam = this.getEnemyTeam()
            const enemies = enemyTeam.getChildren(true, true)

            const explosionRadius = (pumpkin.displayWidth / 2) * 1.2 // Slightly larger than visual

            for (const enemy of enemies) {
                const distance = Phaser.Math.Distance.Between(pumpkin.x, pumpkin.y, enemy.x, enemy.y)
                if (distance <= explosionRadius) {
                    // inside the explosion radius

                    const damage = this.calculateDamage(this.abilityPower * 2)
                    enemy.takeDamage(damage.value, this, "fire", damage.crit, true, this.abilityName)
                }
            }
        }

        this.casting = false
    }
}
