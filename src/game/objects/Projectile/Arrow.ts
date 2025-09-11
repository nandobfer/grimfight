// src/objects/Arrow.ts
import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Projectile } from "./Projectile"

export class Arrow extends Projectile {
    constructor(scene: Game, x: number, y: number, owner: Creature) {
        super(scene, x, y, owner, "arrow", "normal") // <-- ensure 'arrow' texture is preloaded
        // this.toggleFlipX()
        this.setScale(0.05, 0.05)
        this.resetPipeline()
        this.setTint(0xffffff)
        this.setOrigin(0, 0.5)
    }
}
