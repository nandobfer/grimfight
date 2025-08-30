// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"
import { Creature } from "../creature/Creature"

export class IceSpike extends FxSprite {
    constructor(scene: Game, target: Creature) {
        super(scene, target.x, target.y, "ice1", 1)
        // this.setOrigin(0.5, 0.75)
        this.setRotation(-Math.PI / 2)
        this.addLightEffect({
            color: 0x66ddff,
            intensity: 10,
            radius: 45,
            duration: 300,
        })

        const targetWidth = target.displayWidth * target.scaleX
        const targetHeight = target.displayHeight * target.scaleY
        const iceBlockWidth = this.width // Original ice block texture width
        const iceBlockHeight = this.height // Original ice block texture height

        // Calculate scale factors for width and height
        const scaleX = targetWidth / iceBlockWidth
        const scaleY = targetHeight / iceBlockHeight

        this.setScale(scaleX * 1.05, scaleY * 1.15)
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
