// src/game/FireHit.ts
import Phaser from "phaser"
import { Game } from "../scenes/Game"

interface LightParams {
    color: number
    radius: number
    intensity: number
    minIntensity?: number
    maxIntensity?: number
    duration?: number
    repeat?: number
    minRadius?: number
    maxRadius?: number
    yoyo?: boolean
}

export class FxSprite extends Phaser.Physics.Arcade.Sprite {
    private light?: Phaser.GameObjects.Light
    sprite: string
    frameRate = 15

    constructor(scene: Game, x: number, y: number, sprite: string, scale: number) {
        super(scene, x, y, sprite)

        this.sprite = sprite
        this.scene.add.existing(this)
        this.scene.physics.add.existing(this)
        this.setDepth(this.depth + 1) // Make sure it appears above the character
        this.setScale(scale)
        this.initAnimation()

        this.scene.events.on("update", this.followCharacter)

        this.once("animationcomplete", () => {
            this.onAnimationComplete()
        })
    }

    onAnimationComplete() {
        this.cleanup()
    }

    initAnimation() {
        if (!this.scene.anims.exists(this.sprite)) {
            this.scene.anims.create({
                key: this.sprite,
                frames: this.anims.generateFrameNumbers(this.sprite),
                frameRate: this.frameRate,
                repeat: 0,
            })
        }

        this.play(this.texture)
    }

    followCharacter() {
        if (this.active) {
            this.setPosition(this.x, this.y)
        }
    }

    cleanup() {
        if (this.scene) {
            this.scene.events.off("update", this.followCharacter)
        }
        this.destroy()
    }

    addLightEffect(lightParams: LightParams) {
        if (this.scene.lights) {
            this.light = this.scene.lights.addLight(this.x, this.y, lightParams.radius, lightParams.color, lightParams.intensity)

            this.scene.tweens.add({
                targets: this.light,
                radius: { from: lightParams.minRadius, to: lightParams.maxRadius },
                intensity: { from: lightParams.minIntensity, to: lightParams.maxIntensity },
                duration: lightParams.duration,
                yoyo: lightParams.yoyo ?? true,
                repeat: lightParams.repeat ?? -1,
                ease: "Sine.easeInOut",
            })

            this.scene.events.on("update", () => {
                if (this.active && this.light) {
                    this.light.setPosition(this.x, this.y)
                }
            })
        }
    }

    override destroy(fromScene?: boolean): void {
        if (this.light) {
            this.scene?.lights.removeLight(this.light)
        }
        super.destroy(fromScene)
    }
}
