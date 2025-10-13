// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

const animKey = "leaves"
const sprite = "wind2"

export class LeavesFx extends FxSprite {
    animKey = animKey

    constructor(scene: Game, x: number, y: number, scale = 0.75) {
        super(scene, x, y, sprite, scale)
    }

    override initAnimation() {
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(this.sprite, { start: 8, end: 12 }),
                frameRate: this.frameRate,
                repeat: 0,
            })
        }

        this.play(animKey)
    }
}
