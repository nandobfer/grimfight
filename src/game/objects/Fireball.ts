// src/objects/Arrow.ts
import { Creature } from "../creature/Creature"
import { Game } from "../scenes/Game"
import { Projectile } from "./Projectile"

export class Fireball extends Projectile {
    speed = 400

    constructor(scene: Game, x: number, y: number,owner: Creature) {
        super(scene, x, y, owner, "fireball0", "fire")
        this.setScale(0.075, 0.075)
        this.toggleFlipY()
        this.toggleFlipX()
        // this.setCircle(this.width / 9)
        this.setSize(this.width * 0.07, this.height * 0.07) // Adjust size as needed
        // this.setOffset(this.width * 0.025, this.height * 0.25) // Center the hitbox

        if (!this.scene.anims.exists("fireball")) {
            const frames = []

            for (let i = 0; i <= 40; i++) {
                frames.push({
                    key: `fireball${i}`,
                    frame: undefined,
                })
            }

            this.scene.anims.create({
                key: "fireball",
                frames: frames,
                frameRate: 30,
                repeat: -1,
            })
        }

        this.setTint(0xffff00)
        this.addLightEffect()

        this.play("fireball")
    }

    addLightEffect() {
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

    override onHit(target: Creature) {
        if (!target) {
            this.destroy()
            return
        }

        super.onHit(target)
    }
    override onHitWall() {
        super.onHitWall()
        this.destroy()
    }
}
