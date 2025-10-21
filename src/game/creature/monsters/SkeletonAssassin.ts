// src/game/characters/monsters/Skeleton.ts

import { Game } from "../../scenes/Game"
import { Skeleton } from "./Skeleton"

export class SkeletonAssassin extends Skeleton {
    baseMaxHealth = 200
    baseAttackDamage = 50
    baseAttackSpeed = 1.25
    baseSpeed: number = 120

    baseMaxMana: number = 60

    constructor(scene: Game) {
        super(scene, "skeleton_assassin")
        this.preferredPosition = "middle"
        this.challengeRating = this.calculateCR()
    }

    override castAbility(): void {
        this.casting = true

        const target = this.getFartestEnemy()
        if (target) {
            const position = target.randomPointAround()
            this.dashTo(position.x, position.y, () => {
                const damage = this.calculateDamage(this.abilityPower)
                target?.takeDamage(damage.value, this, "normal", damage.crit)
            })
            this.target = target
        }

        this.casting = false
    }

    override refreshStats(): void {
        super.refreshStats()
        this.mana *= this.maxMana * 0.8
    }
}
