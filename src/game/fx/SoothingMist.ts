// src/game/FireHit.ts
import { Creature } from "../creature/Creature"
import { FxSprite } from "./FxSprite"
import { WindBreeze } from "./WindBreezeFx"

const animKey = "soothing_mist"
const sprite = "wind"

export class SoothingMist extends FxSprite {
    declare target: Creature
    caster: Creature
    targetFx: FxSprite

    constructor(target: Creature, caster: Creature) {
        super(target.scene, target.x, target.y, sprite, 0.5)
        this.target = target
        this.caster = caster

        this.addLightEffect({
            color: 0x00ff88,
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

        this.updateBeamPosition()
        this.targetFx = new WindBreeze(this.scene, this.target.x, this.target.y)
        this.targetFx.setDepth(this.depth + 1)
    }

    updateBeamPosition() {
        if (!this.caster || !this.target) return

        // Use center positions of both bodies
        const casterCenterX = this.caster.x
        const casterCenterY = this.caster.y - 10 // Slightly above center for visual appeal
        const targetCenterX = this.target.x
        const targetCenterY = this.target.y - 10 // Slightly above center for visual appeal

        const distance = Phaser.Math.Distance.Between(casterCenterX, casterCenterY, targetCenterX, targetCenterY)
        const angle = Phaser.Math.Angle.Between(casterCenterX, casterCenterY, targetCenterX, targetCenterY)

        // Position at the caster's center
        this.setPosition(casterCenterX, casterCenterY)

        // Set origin to bottom center so it starts from caster center
        this.setOrigin(0.5, 0)

        // Set rotation to point from caster to target
        this.setRotation(angle - Math.PI / 2) // Subtract 90 degrees since wind flows bottom to top

        // Scale height to exactly reach the target center
        const spriteBaseHeight = 192 // Correct sprite height
        const baseScale = 0.5 // The base scale we want for width
        // Calculate the Y scale needed to reach exactly the target center
        const scaleY = distance / spriteBaseHeight // Adjusted for 192px height
        this.setScale(baseScale, scaleY) // Width stays at base scale, height scales to distance
    }

    override initAnimation() {
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(this.sprite, { start: 16, end: 24 }),
                frameRate: this.frameRate,
                repeat: -1,
                yoyo: true,
            })
        }

        this.play(animKey)
    }

    override destroy(fromScene?: boolean): void {
        super.destroy(fromScene)
        if (this.targetFx) {
            this.targetFx.destroy()
        }
    }
}
