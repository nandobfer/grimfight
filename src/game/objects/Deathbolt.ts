// src/objects/Arrow.ts
import { Creature } from "../creature/Creature"
import { Game } from "../scenes/Game"
import { Fireball } from "./Fireball"

export class Deathbolt extends Fireball {
    speed = 400

    constructor(scene: Game, x: number, y: number, owner: Creature) {
        super(scene, x, y, owner)

        this.setTint(0x0000ff)
        this.damageType = "true"
    }

    override addLightEffect(): void {}
}
