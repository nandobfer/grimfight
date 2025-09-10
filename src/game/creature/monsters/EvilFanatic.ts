import { Game } from "../../scenes/Game"
import { RagnarokMonster } from "./RagnarokMonster"

export class EvilFanatic extends RagnarokMonster {
    baseMaxHealth = 5000
    baseAttackDamage = 50
    baseAttackSpeed = 1
    baseMaxMana = 100
    baseScale: number = 0.4

    constructor(scene: Game) {
        super(scene, "evil_fanatic")
        this.preferredPosition = "front"
        this.challengeRating = this.calculateCR()

        this.setSize(this.width / 2, this.height / 2)
    }

    override createAnimations() {
        this.extractAnimationsFromSpritesheet("idle", 1, 5, 7, this.name, this.name, true)
        this.extractAnimationsFromSpritesheet("walking", 15, 6, 7)
        this.extractAnimationsFromSpritesheet("attacking1", 29, 6, 7)
        this.extractAnimationsFromSpritesheet("attacking2", 29, 6, 7)
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
            attackSpeed: { from: this.attackSpeed, to: this.attackSpeed * this.abilityPower * 0.05 },
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
