import { Game } from "../../scenes/Game"
import { RagnarokMonster } from "./RagnarokMonster"

export class Mantis extends RagnarokMonster {
    baseMaxHealth = 250
    baseAttackDamage = 15
    baseAttackSpeed = 1
    baseMaxMana = 0
    baseScale: number = 0.5
    manaLocked: boolean = true

    bonusAttackSpeed = 0
    missingHealthPercent = 1
    aura

    constructor(scene: Game) {
        super(scene, "mantis")
        this.preferredPosition = "front"
        this.challengeRating = this.calculateCR()

        this.setSize(this.width / 2, this.height / 2)

        this.aura = this.postFX.addGlow(0xff5555, 0)
    }

    override getAttackingAnimation(): string {
        return "attacking"
    }

    override createAnimations() {
        this.extractAnimationsFromSpritesheet("idle", 1, 8, 9, this.name, true)
        this.extractAnimationsFromSpritesheet("walking", 19, 6, 9)
        this.extractAnimationsFromSpritesheet("attacking", 37, 7, 9)
    }

    scaleSpeedWithLife() {
        this.missingHealthPercent = 2 - this.health / this.maxHealth
        this.attackSpeed = this.baseAttackSpeed * this.bonusAttackSpeed * this.missingHealthPercent
        this.aura.outerStrength = (this.missingHealthPercent - 1) * 1.5
    }

    override reset(): void {
        super.reset()
        this.bonusAttackSpeed = this.attackSpeed
        this.missingHealthPercent = 1
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)

        if (this.active) {
            this.scaleSpeedWithLife()
        }
    }
}
