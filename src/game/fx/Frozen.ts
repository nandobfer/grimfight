import { Creature } from "../creature/Creature"
import { FxSprite } from "./FxSprite"

export class Frozen extends FxSprite {
    target: Creature

    constructor(target: Creature) {
        super(target.scene, target.x, target.y, "frozen", 1)
        this.target = target

        const targetWidth = target.displayWidth * target.scaleX
        const targetHeight = target.displayHeight * target.scaleY
        const iceBlockWidth = this.width // Original ice block texture width
        const iceBlockHeight = this.height // Original ice block texture height

        // Calculate scale factors for width and height
        const scaleX = targetWidth / iceBlockWidth
        const scaleY = targetHeight / iceBlockHeight

        this.setScale(scaleX*1.15, scaleY*1.25)

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

    override onAnimationComplete(): void {}
}
