import { Creature } from "../creature/Creature"
import { Game } from "../scenes/Game"
import { FxSprite } from "./FxSprite"

export class Frozen extends FxSprite {
    target: Creature

    constructor(scene: Game, x: number, y: number, target: Creature) {
        super(scene, x, y - 15, "frozen", 0.8)
        this.target = target

        const targetWidth = target.displayWidth * target.scaleX
        const targetHeight = target.displayHeight * target.scaleY
        const iceBlockWidth = this.width // Original ice block texture width
        const iceBlockHeight = this.height // Original ice block texture height

        // Calculate scale factors for width and height
        const scaleX = targetWidth / iceBlockWidth
        const scaleY = targetHeight / iceBlockHeight

        this.setScale(scaleX * 1.15, scaleY * 1.25)

        this.addLightEffect({
            color: 0x66ddff,
            intensity: 1,
            radius: 50,
            duration: 300,
        })

        this.setDepth(this.target.depth + 2)
    }

    override onAnimationComplete(): void {}
}
