import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Barbarian extends Character {
    baseMaxHealth = 550
    baseAttackDamage = 25
    baseMaxMana = 0
    manaLocked: boolean = true
    baseAttackSpeed: number = 1.15
    baseArmor: number = 10

    abilityName: string = "Berserker"

    bonusAttackSpeed = 0
    bonusSpeed = 0
    missingHealthMultiplier = 1

    constructor(scene: Game, id: string) {
        super(scene, "grok", id)
    }

    override getAbilityDescription(): string {
        return `Gains [warning.main:1%] attack speed for each percentage of health missing.`
    }

    scaleSpeedWithLife() {
        this.missingHealthMultiplier = this.multFromHealth()

        this.attackSpeed = this.bonusAttackSpeed * this.missingHealthMultiplier
        this.speed = this.bonusSpeed * this.missingHealthMultiplier
    }

    private multFromHealth(): number {
        const missingHealthPercent = this.getMissingHealthFraction()
        const multiplier = 2 - missingHealthPercent

        if (missingHealthPercent <= 0.4) {
            this.setTint(0xff0000)
        } else {
            this.clearTint()
        }

        return Phaser.Math.Clamp(multiplier, 1, 2)
    }

    override refreshStats(): void {
        super.refreshStats()
        this.bonusAttackSpeed = this.attackSpeed
        this.bonusSpeed = this.speed
        this.missingHealthMultiplier = 1
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)

        if (this.active) {
            this.scaleSpeedWithLife()
        }
    }
}
