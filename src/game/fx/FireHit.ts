// src/game/FireHit.ts
import Phaser from "phaser";

export class FireHit extends Phaser.GameObjects.Sprite {
    private light: Phaser.GameObjects.Light

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "firehit0")

        if (!scene.anims.exists("fire-hit")) {
            const frames = []

            for (let i = 0; i <= 22; i++) {
                frames.push({
                    key: `firehit${i}`,
                    frame: undefined,
                })
            }

            scene.anims.create({
                key: "fire-hit",
                frames: frames,
                frameRate: 45,
                repeat: 0,
            })
        }

        this.once("animationcomplete", () => {
            this.destroy()
        })
        this.once("animationstop", () => {
            this.destroy()
        })

        this.play("fire-hit")
        scene.add.existing(this)
        this.setScale(0.15)
        this.addLightEffect()
    }

    private addLightEffect() {
        if (this.scene.lights) {
            this.light = this.scene.lights.addLight(this.x, this.y, 150, 0xff6600, 1)

            this.scene.tweens.add({
                targets: this.light,
                radius: { from: 80, to: 120 },
                intensity: { from: 3, to: 4 },
                duration: 300,
                yoyo: true,
                repeat: -1,
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
        this.scene.lights.removeLight(this.light)
        super.destroy(fromScene)
    }
}