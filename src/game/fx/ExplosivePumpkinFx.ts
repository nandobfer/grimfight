// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

const animKey = "explosive_pumpkin"
const sprite = "explosive_pumpkin"

export class ExplosivePumpkinFx extends FxSprite {
    animKey = animKey
    frameIndexCallback = 24

    constructor(scene: Game, x: number, y: number, scale = 0.5) {
        super(scene, x, y, sprite, scale, undefined)
        this.addLightEffect({ color: 0xff6600, intensity: 3, radius: 70 })
    }

    override initAnimation() {
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(this.sprite, { end: 25 }),
                frameRate: this.frameRate,
                repeat: 0,
            })
        }

        this.play(animKey)
    }

    override executeFrameCallback() {
        this.scene.cameras.main.shake(100, 0.01)
        this.setScale(this.scale * 2)
        if (this.light) {
            this.light.setRadius(this.light.radius * 30)
            this.light.setIntensity(this.light.intensity * 30)
        }

        this.onExplode()
    }

    onExplode() {}
}
