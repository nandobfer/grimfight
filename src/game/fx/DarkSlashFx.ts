// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Creature } from "../creature/Creature"

const animKey = "dark_slash"
const sprite = "dark_slash"

export class DarkSlashFx extends FxSprite {
    animKey = animKey

    constructor(target: Creature) {
        super(target.scene, target.x, target.y, sprite, 0.4, target)
        this.setOrigin(0.5, 0.75)
    }

    override initAnimation() {
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(this.sprite, { start: 9, end: 15 }),
                frameRate: this.frameRate,
                repeat: 0,
            })
        }

        this.play(animKey)
    }
}
