import { Creature } from "../creature/Creature"
import { FxSprite } from "./FxSprite"

export class Heal extends FxSprite {
    target: Creature
    
    constructor(target: Creature) {
        super(target.scene, target.x, target.y, "heal4", 0.5)
        this.target = target

        this.addLightEffect({
            color: 0x66ff00,
            intensity: 1,
            radius: 150,
            duration: 300,
            maxIntensity: 2,
            maxRadius: 80,
            minIntensity: 1,
            minRadius: 40,
            repeat: 0,
            yoyo: true,
        })

        // this.target.once("destroy", () => {
        //     if (this.active) {
        //         this.cleanup()
        //     }
        // })
    }
}
