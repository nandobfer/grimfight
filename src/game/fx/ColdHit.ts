// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

export class ColdHit extends FxSprite {
    constructor(scene: Game, x: number, y: number) {
        super(scene, x, y, "ice2", 0.5)

        this.addLightEffect({
            color: 0x66ddff,
            intensity: 1,
            radius: 70,
            duration: 300,
            maxIntensity: 4,
            minIntensity: 3,
            maxRadius: 70,
            minRadius: 40,
        })
    }

    initAnimation() {
        if (!this.scene.anims.exists('cold-hit')) {
            this.scene.anims.create({
                key: 'cold-hit',
                frames: this.anims.generateFrameNumbers('ice2', { start: 1, end: 4 }),
                frameRate: this.frameRate,
                repeat: 0,
                
            })
        }

        this.play('cold-hit')
    }
}
