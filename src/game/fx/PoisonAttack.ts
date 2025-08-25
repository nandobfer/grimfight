// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

export class PoisonAttack extends FxSprite {
    constructor(scene: Game, x: number, y: number) {
        super(scene, x, y, "poison_attack", 1)

        this.addLightEffect({
            color: 0x66ff66,
            intensity: 5,
            radius: 40,
            duration: 300,
        })
    }
}
