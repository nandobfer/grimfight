// src/game/characters/monsters/Skeleton.ts

import { LifeDrain } from "../../fx/LifeDrain"
import { SoulParticles } from "../../fx/SoulParticles"
import { Deathbolt } from "../../objects/Projectile/Deathbolt"
import { Dot } from "../../objects/StatusEffect/Dot"
import { Game } from "../../scenes/Game"
import { Skeleton } from "./Skeleton"

export class SkeletonDrainer extends Skeleton {
    baseMaxHealth = 350
    baseAttackDamage = 25
    baseAttackSpeed = 0.75
    baseAttackRange = 3

    abilityName = "Life Drain"

    constructor(scene: Game) {
        super(scene, "skeleton_drainer")
        this.preferredPosition = "back"
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

        const projectile = new Deathbolt(this.scene, this.x, this.y, this).fire(target)
    }

    override castAbility(): void {
        if (!this.target || !this.active) return

        this.casting = true

        this.startChanneling()
        const lifeDrain = new LifeDrain(this.target, this)

        const dot = new Dot({
            abilityName: this.abilityName,
            damageType: "dark",
            duration: 5000,
            target: this.target,
            tickDamage: this.abilityPower * 0.1,
            tickRate: 750,
            user: this,
            onExpire: () => {
                lifeDrain.destroy(true)
                this.stopChanneling()
                this.casting = false
            },
            onTick: (damage) => {
                const lowestHealth = this.team.getLowestHealth()
                if (lowestHealth) {
                    lowestHealth.heal(damage)
                    new SoulParticles(this.scene, lowestHealth.x, lowestHealth.y)
                }
            },
        }).start()
    }
}
