import { PoisonBubble } from "../../objects/Projectile/PoisonBubble"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { calculateLucioPoisonBubbleTotalApRatio, calculateLucioPoisonBubbleTotalRawDamage } from "./LucioPoisonBubble"

const poisonNovaBubbleCount = 12

export class Lucio extends Character {
    baseAttackSpeed = 0.3
    baseAttackRange = 4
    baseAttackDamage = 10
    baseMaxHealth = 275
    baseMaxMana = 100
    baseManaPerSecond = 8
    baseAbilityPower = 50

    abilityName = "Poison Nova"
    private readonly attackBubbleSource = "Poison Bubble"

    constructor(scene: Game, id: string) {
        super(scene, "lucio", id)
    }

    override getAbilityDescription(): string {
        const poisonDamage = Math.round(calculateLucioPoisonBubbleTotalRawDamage(this.abilityPower))
        const poisonApRatio = Math.round(calculateLucioPoisonBubbleTotalApRatio() * 100)

        return `Attacks launch a slow poison bubble. The poison deals [info.main:${poisonDamage} (${poisonApRatio}% AP)] damage over 5 seconds. On cast, [primary.main:${this.abilityName}] launches [info.main:${poisonNovaBubbleCount}] poison bubbles in every direction around him.`
    }

    override landAttack(): void {
        const target = this.target
        if (!target?.active || !this.active) return

        new PoisonBubble(this.scene, this.x, this.y - 16, this, this.attackBubbleSource, { triggerOnHit: true }).fire(target, this.x, this.y - 16)
    }

    override castAbility(multiplier = 1): boolean | void {
        if (!this.active) return false

        this.casting = true
        this.playCastingAnimation()

        for (let index = 0; index < poisonNovaBubbleCount; index++) {
            const angle = (Math.PI * 2 * index) / poisonNovaBubbleCount
            new PoisonBubble(this.scene, this.x, this.y - 16, this, this.abilityName, { multiplier }).fireAtAngle(angle, this.x, this.y - 16)
        }

        this.casting = false
    }

    override refreshStats(): void {
        super.refreshStats()
        this.gainMana(this.maxMana * 0.3)
    }

    private playCastingAnimation(): void {
        const key = `${this.getAnimationTextureName()}-casting-${this.facing}`
        this.play({ key, frameRate: 14, repeat: 0 }, true)
    }
}
