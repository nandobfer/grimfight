// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

export class MagicShieldFx extends FxSprite {
    constructor(scene: Game, x: number, y: number, scale: number) {
        super(scene, x, y, "magic_shield", scale)
        // this.toggleFlipY()
        // this.setTint(0x00ff00)
        // this.addLightEffect({
        //     color: 0x66ff66,
        //     intensity: 1,
        //     radius: 40,
        //     duration: 300,
        // })
    }

    override initAnimation() {
        if (!this.scene.anims.exists(`${this.sprite}-start`)) {
            this.scene.anims.create({
                key: `${this.sprite}-start`,
                frames: this.anims.generateFrameNumbers(this.sprite, { start: 1, end: 4 }),
                frameRate: this.frameRate,
                repeat: 0,
                yoyo: false,
            })
        }

        if (!this.scene.anims.exists(`${this.sprite}-loop`)) {
            this.scene.anims.create({
                key: `${this.sprite}-loop`,
                frames: this.anims.generateFrameNumbers(this.sprite, { start: 5, end: 10 }),
                frameRate: this.frameRate,
                repeat: -1,
                yoyo: true,
            })
        }

        if (!this.scene.anims.exists(`${this.sprite}-end`)) {
            this.scene.anims.create({
                key: `${this.sprite}-end`,
                frames: this.anims.generateFrameNumbers(this.sprite, { start: 11 }),
                frameRate: this.frameRate,
                repeat: 0,
                yoyo: false,
                hideOnComplete: true,
            })
        }

        const anim = this.play(`${this.sprite}-loop`)
        // não funcionou essa buceta
        // anim.once("animationcomplete", () => {
        //     this.play(`${this.sprite}-loop`)
        // })
    }

    finish() {
        if (this?.active) {
            const anim = this.play(`${this.sprite}-end`)
            anim.once("animationcomplete", () => {
                this?.destroy(true)
            })
        }
    }
}
