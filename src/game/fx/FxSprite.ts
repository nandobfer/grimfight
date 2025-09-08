// src/game/FireHit.ts
import Phaser from "phaser"
import { Game, GameState } from "../scenes/Game"
import { EventBus } from "../tools/EventBus"
import { Creature } from "../creature/Creature"

export interface LightParams {
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
    declare scene: Game
    target?: Creature

    constructor(scene: Game, x: number, y: number, sprite: string, scale: number, target?: Creature) {
        super(scene, x, y, sprite)

        this.target = target
        this.sprite = sprite
        this.scene.add.existing(this)
        this.scene.physics.add.existing(this)
        // const characterInPosition = this.scene.grid.
        this.setDepth(this.depth + 1) // Make sure it appears above the character
        const currentRow = this.scene.grid.worldToCell(this.x, this.y)?.row
        if (currentRow && this.active) {
            this.setDepth(currentRow + 1)
        }
        this.setScale(scale)
        this.initAnimation()

        this.setPipeline("Light2D")

        this.target?.on("move", this.followCharacter)
        EventBus.once("gamestate", (state: GameState) => {
            if (state === "idle") {
                this.cleanup()
            }
        })

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

    followCharacter(x: number, y: number) {
        this.setPosition(x, y)
        // this.body?.reset(x, y)
    }

    cleanup() {
        if (this.scene) {
            this.target?.off("move", this.followCharacter)
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

            const handleUpdate = () => {
                if (this.active && this.light) {
                    this.light.setPosition(this.x, this.y)
                }
            }
            this.scene.events.on("update", handleUpdate)
            this.once("destroy", () => {
                this.scene.events.off("update", handleUpdate)
                this.light = undefined
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
