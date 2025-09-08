// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"
import { Creature } from "../creature/Creature"

export class ThornsFx extends FxSprite {
    constructor(scene: Game, x: number, y: number, scale: number, target: Creature) {
        super(scene, x, y, "thunder", scale, target)
        this.setOrigin(0.5, 0.75)
        // this.toggleFlipY()
        this.setTint(0x00ff00)
        // this.addLightEffect({
        //     color: 0x66ff66,
        //     intensity: 1,
        //     radius: 40,
        //     duration: 300,
        // })
    }

    override initAnimation() {
        if (!this.scene.anims.exists(this.sprite)) {
            this.scene.anims.create({
                key: this.sprite,
                frames: this.anims.generateFrameNumbers(this.sprite, { start: 1, end: 9 }),
                frameRate: this.frameRate,
                repeat: -1,
                yoyo: true,
            })
        }

        this.play(this.texture)
    }
}
