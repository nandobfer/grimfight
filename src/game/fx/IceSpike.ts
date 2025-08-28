// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

export class IceSpike extends FxSprite {
    constructor(scene: Game, x: number, y: number, scale: number) {
        super(scene, x, y, "ice1", scale)
        this.setOrigin(0.5, 0.75)
        this.setRotation(-Math.PI / 2)
        this.addLightEffect({
            color: 0x66ddff,
            intensity: 10,
            radius: 45,
            duration: 300,
        })
    }

    override initAnimation() {
        if (!this.scene.anims.exists(this.sprite)) {
            this.scene.anims.create({
                key: this.sprite,
                frames: this.anims.generateFrameNumbers(this.sprite, { first: 6, end: 8 }),
                frameRate: this.frameRate,
                repeat: 0,
            })
        }

        this.play(this.texture)
    }
}
