// src/game/FireHit.ts
import { FxSprite } from "./FxSprite"
import { Game } from "../scenes/Game"

export class FireHit extends FxSprite {
    constructor(scene: Game, x: number, y: number) {
        super(scene, x, y, "firehit0")

        this.setScale(0.15)
        this.addLightEffect({
            color: 0xff6600,
            intensity: 1,
            radius: 150,
            duration: 300,
            maxIntensity: 4,
            minIntensity: 3,
            maxRadius: 120,
            minRadius: 80,
        })
    }

    override initAnimation(): void {
        if (!this.scene.anims.exists("fire-hit")) {
            const frames = []

            for (let i = 0; i <= 22; i++) {
                frames.push({
                    key: `firehit${i}`,
                    frame: undefined,
                })
            }

            this.scene.anims.create({
                key: "fire-hit",
                frames: frames,
                frameRate: 45,
                repeat: 0,
            })
        }
        this.play("fire-hit")
    }
}
