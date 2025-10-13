// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

const animKey = "holy_cross"
const sprite = "holy_cross"

export class HolyCrossFx extends FxSprite {
    animKey = animKey

    constructor(scene: Game, x: number, y: number, scale = 0.5) {
        super(scene, x, y, sprite, scale, undefined)
        this.addLightEffect({ color: 0xfff176, intensity: 2, radius: 20 })
    }

    override initAnimation() {
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(this.sprite),
                frameRate: this.frameRate,
                repeat: 0,
                // yoyo: true,
            })
        }

        this.play(animKey)
    }
}
