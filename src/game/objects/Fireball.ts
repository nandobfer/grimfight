// src/objects/Arrow.ts
import { Creature } from "../creature/Creature"
import { FireHit } from "../fx/FireHit"
import { EventBus } from "../tools/EventBus"
import { Projectile } from "./Projectile"

export class Fireball extends Projectile {
    speed = 400
    private light: Phaser.GameObjects.Light
    private explosion: FireHit

    constructor(owner: Creature) {
        super(owner, "fireball0", "bleeding", "fire")
        this.setScale(0.075, 0.075)
        this.toggleFlipY()
        this.toggleFlipX()
        this.setCircle(this.width / 10)

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
        EventBus.on("gamestate", (state: string) => {
            this.destroy()
        })
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
        const scene = this.owner?.scene || this.scene
        scene?.lights?.removeLight(this.light)
        super.destroy(fromScene)
    }

    private createExplosionEffect() {
        const enemy = this.owner.target
        const x = enemy?.x || this.x
        const y = enemy?.y || this.y
        const scene = this.owner?.scene || this.scene
        if (scene) {
            new FireHit(scene, x, y)
        }
    }

    override onHit(target: Creature) {
        if (!target) {
            this.destroy()
            return
        }

        // const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y)

        // const enemyRadius = target.body.width / 2 // Approximate enemy radius
        // const penetrationDepth = enemyRadius - distance

        // if (penetrationDepth >= 15) {
        super.onHit(target)
        this.createExplosionEffect()
        // }
    }
    override onHitWall() {
        super.onHitWall()
        this.createExplosionEffect()
        this.destroy()
    }
}
