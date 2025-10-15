// src/game/characters/monsters/Skeleton.ts

import { Deathbolt } from "../../objects/Projectile/Deathbolt"
import { Game } from "../../scenes/Game"
import { Summon } from "../../systems/Summon"
import { RNG } from "../../tools/RNG"
import { Skeleton } from "./Skeleton"

export class SkeletonNecromancer extends Skeleton {
    baseMaxHealth = 300
    baseAttackDamage = 30
    baseAttackSpeed = 0.5
    baseAttackRange = 3

    constructor(scene: Game) {
        super(scene, "skeleton_necromancer")
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

        const summon = Summon.summon(RNG.weightedPick(Skeleton.weightedList), this, {
            abilityPower: this.abilityPower * 0.15,
            attackPower: this.abilityPower * 0.15,
            maxHealth: this.abilityPower,
            scale: 0.4,
        })

        this.casting = false
    }
}
