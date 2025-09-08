// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

const animKey = "death_skull"
const sprite = "death_particles"

export class DeathSkullFx extends FxSprite {
    animKey = animKey

    constructor(scene: Game, x: number, y: number, scale = 0.5) {
        super(scene, x, y, sprite, scale)
        this.setOrigin(0.5, 0.5)
        // this.addLightEffect({color: 0xffffff, intensity: 5, radius: 45})
    }

    override initAnimation() {
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(this.sprite, { start: 5, end: 10 }),
                frameRate: this.frameRate,
                repeat: 0,
            })
        }

        this.play(animKey)
    }
}
