// src/objects/Arrow.ts
import { Creature } from "../creature/Creature"
import { ColdHit } from "../fx/ColdHit"
import { Projectile } from "./Projectile"

export class IceShard extends Projectile {
    speed = 300
    private light: Phaser.GameObjects.Light

    constructor(owner: Creature) {
        super(owner, "ice1", "cold")
        this.setScale(0.15, 0.15)
        // this.toggleFlipY()
        this.toggleFlipX()
        // this.setCircle(this.width / 9)
        this.setSize(this.width * 0.05, this.height * 0.05) // Adjust size as needed
        this.setOffset(this.width * 0.25, this.height * 0.25) // Center the hitbox

        if (!this.scene.anims.exists("ice-shard")) {
            this.scene.anims.create({
                key: `ice-shard`,
                frames: this.anims.generateFrameNumbers('ice1', { start: 5, end: 7 }),
                frameRate: 5,
                repeat: 0,
                hideOnComplete: false
            })
        }

        this.addLightEffect()

        this.play("ice-shard")
    }

    private addLightEffect() {
        if (this.scene.lights) {
            this.light = this.scene.lights.addLight(this.x, this.y, 45, 0x66ddff, 10)


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

    private createExplosionEffect(target?: Creature) {
        const x = target?.x || this.x
        const y = target?.y || this.y
        const scene = this.owner?.scene || this.scene
        if (scene) {
            new ColdHit(scene, x, y)
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
        this.createExplosionEffect(target)
        // }
    }
    override onHitWall() {
        super.onHitWall()
        this.createExplosionEffect()
        this.destroy()
    }
}
