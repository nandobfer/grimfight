// src/game/FireHit.ts
import { Creature } from "../creature/Creature"
import { FxSprite } from "./FxSprite"

const animKey = "purple_channeling"
const sprite = "purple_channeling"

export class LifeDrain extends FxSprite {
    declare target: Creature
    caster: Creature

    constructor(target: Creature, caster: Creature) {
        super(target.scene, target.x, target.y, sprite, 0.5)
        this.target = target
        this.caster = caster

        this.addLightEffect({
            color: 0x550055,
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
    }

    updateBeamPosition() {
        if (!this.caster || !this.target) return

        // Use center positions of both bodies
        const casterCenterX = this.caster.x
        const casterCenterY = this.caster.y - 10 // Slightly above center for visual appeal
        const targetCenterX = this.target.x
        const targetCenterY = this.target.y - 10 // Slightly above center for visual appeal

        const distance = Phaser.Math.Distance.Between(targetCenterX, targetCenterY, casterCenterX, casterCenterY)
        const angle = Phaser.Math.Angle.Between(targetCenterX, targetCenterY, casterCenterX, casterCenterY)

        // Position at the target's center (where the drain starts)
        this.setPosition(targetCenterX, targetCenterY)

        // Set origin to left center since sprite flows left to right (horizontally)
        this.setOrigin(0, 0.5)

        // Set rotation to point from target to caster
        // No need to subtract PI/2 since sprite is already horizontal
        this.setRotation(angle)

        // Scale width to exactly reach the caster center
        const spriteBaseWidth = 128 // Sprite flows horizontally
        const baseScale = 0.5 // The base scale we want for height
        // Calculate the X scale needed to reach exactly the caster center
        const scaleX = distance / spriteBaseWidth
        this.setScale(scaleX, baseScale) // Width scales to distance, height stays at base scale
    }

    override initAnimation() {
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(this.sprite, { start: 0, end: 12 }),
                frameRate: this.frameRate,
                repeat: -1,
                yoyo: true,
            })
        }

        this.play(animKey)
    }
}
