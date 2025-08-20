// src/game/characters/monsters/Skeleton.ts

import { Game } from "../../scenes/Game"
import { Monster } from "./Monster"

export class Skeleton extends Monster {
    maxHealth = 150
    attackDamage = 15
    attackSpeed = 1

    constructor(scene: Game, x: number, y: number, texture?: string) {
        super(scene, x, y, texture || "skeleton")
        this.preferredPosition = "middle"
        this.challengeRating = this.calculateCR()
    }

    onHitFx() {
        const particles = this.scene.add.particles(this.x, this.y, "blood", {
            lifespan: 600,
            speed: { min: 30, max: 80 },
            scale: { start: 0.15, end: 0 },
            quantity: 5,
            blendMode: "NORMAL",
            frequency: -1,
            tint: 0xfff,
        })

        particles.explode(3)

        this.scene.time.delayedCall(600, () => {
            particles.destroy()
        })
    }
    onDieFx(): void {}
}
