// src/game/FireHit.ts
import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Projectile } from "./Projectile"

const animKey = "wind_projectile"
const sprite = "wind2"

export class WindRazor extends Projectile {
    animKey = animKey
    destroyOnWallHit: boolean = true

    constructor(scene: Game, x: number, y: number, owner: Creature) {
        super(scene, x, y, owner, sprite, "normal")

        this.setScale(0.5)

        this.initAnimation()
        this.addLightEffect({
            color: 0x00ff88,
            intensity: 1,
            radius: 30,
        })
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

    override onHit(target: Creature) {}
}
