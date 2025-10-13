// src/game/FireHit.ts
import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Projectile } from "./Projectile"

const animKey = "holybolt"
const sprite = "holybolt"

export class Holybolt extends Projectile {
    animKey = animKey
    speed = 400

    constructor(scene: Game, x: number, y: number, owner: Creature) {
        super(scene, x, y, owner, sprite, "holy")
        this.toggleFlipY()
        this.toggleFlipX()
        this.setScale(0.5)
        this.initAnimation()
    }

    initAnimation() {
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(sprite, { start: 0, end: 7 }),
                frameRate: 15,
                repeat: -1,
                yoyo: true,
            })
        }

        this.play(animKey)
    }
}
