// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

const animKey = "holy_beam"
const sprite = "holy_beam"

export class HolyHeal extends FxSprite {
    animKey = animKey

    constructor(scene: Game, x: number, y: number, scale = 0.5) {
        super(scene, x, y, sprite, scale)
        this.addLightEffect({color: 0xfff176, intensity: 3, radius: 100})
    }

    override initAnimation() {
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(this.sprite, { start: 0, end: 10 }),
                frameRate: this.frameRate,
                repeat: 0,
                // yoyo: true,
            })
        }

        this.play(animKey)
    }

    
}
