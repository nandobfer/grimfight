// src/objects/Arrow.ts
import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Projectile } from "./Projectile"

export class IceShard extends Projectile {
    constructor(scene: Game, x: number, y: number, owner: Creature, speed = 300) {
        super(scene, x, y, owner, "ice1", "cold")
        this.speed = speed
        this.setScale(0.15, 0.15)
        // this.toggleFlipY()
        this.toggleFlipX()
        // this.setCircle(this.width / 9)
        this.setSize(this.width * 0.05, this.height * 0.05) // Adjust size as needed
        this.setOffset(this.width * 0.25, this.height * 0.25) // Center the hitbox

        if (!this.scene.anims.exists("ice-shard")) {
            this.scene.anims.create({
                key: `ice-shard`,
                frames: this.anims.generateFrameNumbers("ice1", { start: 5, end: 7 }),
                frameRate: 5,
                repeat: -1,
            })
        }

        this.addLightEffect({ color: 0x66ddff, intensity: 10, radius: 45 })

        this.play("ice-shard")
    }

    override onHit(target: Creature) {
        if (!target) {
            this.destroy()
            return
        }

        super.onHit(target)
    }
}
