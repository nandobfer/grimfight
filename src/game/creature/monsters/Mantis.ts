import { Game } from "../../scenes/Game"
import { RagnarokMonster } from "./RagnarokMonster"

export class Mantis extends RagnarokMonster {
    baseMaxHealth = 250
    baseAttackDamage = 15
    baseAttackSpeed = 1
    baseMaxMana = 30

    constructor(scene: Game) {
        super(scene, "mantis")
        this.preferredPosition = "front"
        this.challengeRating = this.calculateCR()

        this.setScale(0.5)
        this.setSize(this.width / 2, this.height / 2)
    }

    override createAnimations() {
        this.extractAnimationsFromSpritesheet("idle", 1, 8, 1, true)
        this.extractAnimationsFromSpritesheet("walking", 19, 6, 3)
        this.extractAnimationsFromSpritesheet("attacking1", 37, 7, 2)
        this.extractAnimationsFromSpritesheet("attacking2", 37, 7, 2)
    }

    castAbility(): void {
        this.casting = true

        // const originalAttackSpeed = this.attackSpeed
        // const originalScale = this.scale
        const duration = 4000

        this.manaLocked = true
        

        this.scene.tweens.add({
            targets: this,
            scale: { from: this.scale, to: this.scale * 1.25 },
            tint: { from: this.tint, to: 0xff0000 },
            attackSpeed: { from: this.attackSpeed, to: this.attackSpeed * 2 },
            yoyo: true,
            repeat: 0,
            duration: duration,
            ease: "Sine.easeInOut",
            onComplete: () => {
                        this.manaLocked = false

            },
        })

        this.casting = false
    }
}
