// src/game/characters/monsters/Skeleton.ts

import { Game } from "../../scenes/Game"
import { Monster } from "./Monster"

export class Skeleton extends Monster {
    baseMaxHealth = 150
    baseAttackDamage = 15
    baseAttackSpeed = 1

    constructor(scene: Game, texture?: string) {
        super(scene, texture || "skeleton")
        this.preferredPosition = "front"
        this.challengeRating = this.calculateCR()
    }

    // skeleton have no blood
    override onNormalHit() {
        const particles = this.scene.add.particles(this.x, this.y, "blood", {
            lifespan: 600,
            speed: { min: 30, max: 80 },
            scale: { start: 0.15, end: 0 },
            quantity: 5,
            // blendMode: "NORMAL",
            frequency: -1,
            tint: 0xfff,
        })

        particles.explode(3)

        this.scene.time.delayedCall(600, () => {
            particles.destroy()
        })
    }
    override onDieFx(): void {}

    override castAbility(): void {
        this.casting = true
        const originalAD = this.attackDamage
        this.attackDamage = originalAD * 3

        this.scene.tweens.add({
            targets: this,
            scale: { from: this.scale, to: this.scale * 1.25 },
            yoyo: true,
            repeat: 0,
            duration: 500,
            ease: "Sine.easeInOut",
        })

        this.landAttack()
        this.attackDamage = originalAD

        this.casting = false
    }
}
