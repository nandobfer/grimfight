// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

export class MagicShieldFx extends FxSprite {
    constructor(scene: Game, x: number, y: number, scale: number) {
        super(scene, x, y, "magic_shield", scale)
    }
}
