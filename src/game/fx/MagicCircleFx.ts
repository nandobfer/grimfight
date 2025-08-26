// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

export class MagicCircleFx extends FxSprite {
    constructor(scene: Game, x: number, y: number) {
        super(scene, x, y, "magic_circle2", 0.5)

        this.addLightEffect({
            color: 0xFFE6FF, // or 0xF46794
            intensity: 20,
            radius: 45,
            duration: 100,
        })
    }
}
