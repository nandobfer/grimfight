import { Game } from "../../scenes/Game"
import { Monster } from "./Monster"

export class RagnarokMonster extends Monster {

    constructor(scene: Game, texture: string) {
        super(scene, texture)
    }

    override createAnimations() {}

    extractAnimationsFromSpritesheet(key: string, startingFrame: number, framesPerRow = 6, offsetFrames = 1, yoyo?: boolean) {
        const directions = ["down-right", "up-left"]
        let currentFrameCount = startingFrame - 1

        for (const duoDirection of directions) {
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

        this.setFlipX(this.facing === "down" || this.facing === "right")
    }
}
