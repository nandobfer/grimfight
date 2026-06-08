import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Projectile } from "./Projectile"

export class SoulKnife extends Projectile {
    constructor(scene: Game, x: number, y: number, owner: Creature) {
        super(scene, x, y, owner, "arrow", "dark")
        this.setScale(0.05, 0.05)
        this.setTint(0xff55dd)
        this.setOrigin(0, 0.5)
        this.addLightEffect({ color: 0xd946ef, intensity: 4, radius: 45 })
    }
}
