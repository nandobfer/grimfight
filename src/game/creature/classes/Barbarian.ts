import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Barbarian extends Character {
    baseMaxHealth = 550
    baseAttackDamage = 25
    baseMaxMana = 0
    manaLocked: boolean = true
    baseAttackSpeed: number = 1.15
    baseAbilityPower: number = 25

    abilityName: string = "Berserker"

    bonusAttackSpeed = 0
    bonusSpeed = 0
    missingHealthPercent = 1

    constructor(scene: Game, id: string) {
        super(scene, "grok", id)
    }

    override getAbilityDescription(): string {
        return `Ganha [warning.main:1%] velocidade de ataque bônus para cada porcentagem de vida perdida.`
    }

    getHealValue() {
        return (1 - this.health / this.maxHealth) * 0.12 * this.maxHealth + this.abilityPower * 2
    }

    // castAbility(): void {
    //     this.casting = true
    //     const { value: healing, crit } = this.calculateDamage(this.getHealValue())
    //     this.heal(healing, crit)

    //     this.casting = false
    // }

    scaleSpeedWithLife() {
        this.missingHealthPercent = this.multFromHealth()

        this.attackSpeed = this.bonusAttackSpeed * this.missingHealthPercent
        this.speed = this.bonusSpeed * this.missingHealthPercent
    }

    private multFromHealth(): number {
        if (this.maxHealth <= 0) return 1
        // 1 at full HP → 2 at 0 HP
        const m = 2 - this.health / this.maxHealth
        return Phaser.Math.Clamp(m, 1, 2)
    }

    override refreshStats(): void {
        super.refreshStats()
        this.bonusAttackSpeed = this.attackSpeed
        this.bonusSpeed = this.speed
        this.missingHealthPercent = 1
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)

        if (this.active) {
            this.scaleSpeedWithLife()
        }
    }
}
