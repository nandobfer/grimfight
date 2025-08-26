// src/objects/Arrow.ts
import { Creature } from "../creature/Creature"
import { Fireball } from "./Fireball"

export class Deathbolt extends Fireball {
    speed = 400

    constructor(owner: Creature) {
        super(owner)

        this.setTint(0x0000ff)
        this.damageType = 'true'
    }

    override addLightEffect(): void {}
}
