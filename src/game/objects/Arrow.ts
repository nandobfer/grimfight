// src/objects/Arrow.ts
import { Character } from "../characters/Character"
import { Projectile } from "./Projectile"

export class Arrow extends Projectile {

    constructor(owner: Character) {
        super(owner, "arrow", "bleeding", "normal") // <-- ensure 'arrow' texture is preloaded
        // this.toggleFlipX()
        this.setScale(0.05, 0.05)
    }
}
