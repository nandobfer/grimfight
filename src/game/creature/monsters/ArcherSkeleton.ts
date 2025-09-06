// src/game/characters/monsters/Skeleton.ts

import { Arrow } from "../../objects/Arrow"
import { Game } from "../../scenes/Game"
import { Skeleton } from "./Skeleton"

export class ArcherSkeleton extends Skeleton {
    baseMaxHealth = 300
    baseAttackDamage = 30
    baseAttackSpeed = 0.75
    baseAttackRange = 4

    constructor(scene: Game) {
        super(scene, "skeleton_archer")
        this.preferredPosition = "back"
        this.attackAnimationImpactFrame = 9
        this.challengeRating = this.calculateCR()
    }

    override getAttackingAnimation(): string {
        return "attacking"
    }

    override extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking", 208, 13)
    }

    override landAttack(target = this.target) {
        if (!target || !this.active) return

        const arrow = new Arrow(this)
        arrow.fire(target)
    }

    override castAbility(): void {
        this.casting = true

        const arrow = new Arrow(this)
        arrow.setScale(0.15, 0.15)

        arrow.onHit = (target) => {
            const {value, crit} = this.calculateDamage(this.attackDamage*3)
            target.takeDamage(value, this, 'normal', crit)
            arrow.destroy()
        }

        this.casting = false
        
        
    }
}
