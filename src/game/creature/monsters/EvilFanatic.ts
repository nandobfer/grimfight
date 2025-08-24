import { Game } from "../../scenes/Game"
import { Monster } from "./Monster"

export class EvilFanatic extends Monster {
    baseMaxHealth = 5000
    baseAttackDamage = 50
    baseAttackSpeed = 1
    baseMaxMana = 100

    constructor(scene: Game) {
        super(scene, "evil_fanatic")
        this.preferredPosition = "front"
        this.challengeRating = this.calculateCR()

        this.setScale(0.4)
        this.setSize(this.width/2, this.height/2)
    }

    override createAnimations() {
        this.extractAnimationsFromSpritesheet("idle", 1, 5, true)
        this.extractAnimationsFromSpritesheet("walking", 15)
        this.extractAnimationsFromSpritesheet("attacking1", 29)
        this.extractAnimationsFromSpritesheet("attacking2", 29)
    }

    extractAnimationsFromSpritesheet(key: string, startingFrame: number, framesPerRow = 6, yoyo?: boolean) {
        const directions = [ "down-right", "up-left",]
        let currentFrameCount = startingFrame-1
        const offsetFrames = 7 - framesPerRow

        for (const  duoDirection of directions) {
            const splitedDirections = duoDirection.split("-")
            for (const direction of splitedDirections) {
                this.anims.create({
                    key: `${this.name}-${key}-${direction}`,
                    frames: this.anims.generateFrameNumbers(this.name, { start: currentFrameCount, end: currentFrameCount + framesPerRow - 1 }),
                    frameRate: framesPerRow + 1,
                    repeat: -1,
                    yoyo: yoyo,
                    
                })
            }
            currentFrameCount += framesPerRow + offsetFrames
        }
    }

    updateFacingDirection(): void {
        super.updateFacingDirection()

        this.setFlipX(this.facing === 'down' || this.facing === 'right')
    }

    castAbility(): void {
        this.casting = true

        // const originalAttackSpeed = this.attackSpeed
        // const originalScale = this.scale
        const duration = 4000
        const originalManaPerAttack = this.manaPerAttack
        const originalManaPerSecond = this.manaPerSecond

        this.manaPerAttack = 0
        this.manaPerSecond = 0

        this.scene.tweens.add({
            targets: this,
            scale: { from: this.scale, to: this.scale * 1.25 },
            tint: { from: this.tint, to: 0xff0000 },
            attackSpeed: {from: this.attackSpeed, to: this.attackSpeed*2},
            yoyo: true,
            repeat: 0,
            duration: duration,
            ease: "Sine.easeInOut",
            onComplete: () => {
                this.manaPerAttack = originalManaPerAttack
                this.manaPerSecond = originalManaPerSecond
            }
        })

        this.casting = false
    }
}
