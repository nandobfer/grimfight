// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

export class LightningHit extends FxSprite {
    constructor(scene: Game, x: number, y: number) {
        super(scene, x, y, "lightning", 0.5)

        this.addLightEffect({
            color: 0x2525ff,
            intensity: 20,
            radius: 35,
            duration: 100,
        })
    }
}
