// src/objects/Arrow.ts
import { Creature } from "../../creature/Creature"
import { Frozen } from "../../fx/Frozen"
import { Game } from "../../scenes/Game"
import { Condition } from "../StatusEffect/Condition"
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
                repeat: 0,
                hideOnComplete: false,
            })
        }

        this.addLightEffect()

        this.play("ice-shard")
    }

    private addLightEffect() {
        if (this.scene.lights) {
            this.light = this.scene.lights.addLight(this.x, this.y, 45, 0x66ddff, 10)

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

        // const freeze = new Condition({
        //     attributes: ["moveLocked", "attackLocked", "speed"],
        //     values: [true, true, 0],
        //     duration: 1000,
        //     target: target,
        //     user: this.owner,
        //     renderFx: () => new Frozen(this.scene, target.x, target.y, target),
        //     onExpire: () => {
        //         if (!this.owner) return
        //         this.owner.manaLocked = false
        //         this.owner.attackLocked = false
        //     },
        // })

        // freeze.start()

        super.onHit(target)

    }
    override onHitWall() {
        super.onHitWall()
        this.destroy()
    }
}
