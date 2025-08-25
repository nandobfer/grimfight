// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

export class PoisonHit extends FxSprite {
    constructor(scene: Game, x: number, y: number) {
        super(scene, x, y, "poison", 0.5)

        this.addLightEffect({
            color: 0x66ff66,
            intensity: 1,
            radius: 40,
            duration: 300,
        })
    }
}
