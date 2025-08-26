import { Game } from "../../scenes/Game"
import { Monster } from "./Monster"

export class RagnarokMonster extends Monster {
    constructor(scene: Game, texture: string) {
        super(scene, texture)
    }

    override createAnimations() {}

    extractAnimationsFromSpritesheet(
        key: string,
        startingFrame: number,
        usedFramesPerRow: number,
        totalFramesPerRow = 13,
        texture = this.name,
        yoyo?: boolean
    ) {
        const directions = ["down-right", "up-left"]
        let currentFrameCount = startingFrame - 1
        const animations: Phaser.Animations.Animation[] = []

        for (const duoDirection of directions) {
            const splitedDirections = duoDirection.split("-")
            for (const direction of splitedDirections) {
                const animation = this.anims.create({
                    key: `${this.name}-${key}-${direction}`,
                    frames: this.anims.generateFrameNumbers(texture, { start: currentFrameCount, end: currentFrameCount + usedFramesPerRow - 1 }),
                    frameRate: usedFramesPerRow + 1,
                    repeat: -1,
                    yoyo: yoyo,
                })
                if (animation) animations.push(animation)
            }
            currentFrameCount += usedFramesPerRow + totalFramesPerRow - usedFramesPerRow
        }
        return animations
    }

    updateFacingDirection(): void {
        super.updateFacingDirection()

        this.setFlipX(this.facing === "down" || this.facing === "right")
    }
}
