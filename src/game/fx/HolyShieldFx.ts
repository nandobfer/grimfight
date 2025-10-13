// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

const animKey = "holy_shield"
const sprite = "holy_shield"

export class HolyShieldFx extends FxSprite {
    animKey = animKey

    constructor(scene: Game, x: number, y: number, scale = 0.5) {
        super(scene, x, y, sprite, scale, undefined)
        this.addLightEffect({ color: 0xfff176, intensity: 2, radius: 20 })
    }

    override initAnimation() {
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(this.sprite, {end: 15}),
                frameRate: this.frameRate,
                repeat: 0,
                // yoyo: true,
            })
        }

        this.play(animKey)
    }
}
