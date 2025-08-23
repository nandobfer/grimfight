// src/objects/Arrow.ts
import { Creature } from "../creature/Creature"
import { Projectile } from "./Projectile"

export class Arrow extends Projectile {
    constructor(owner: Creature) {
        super(owner, "arrow", "bleeding", "normal") // <-- ensure 'arrow' texture is preloaded
        // this.toggleFlipX()
        this.setScale(0.05, 0.05)
        this.resetPipeline()
        this.setTint(0xffffff)
    }
}
