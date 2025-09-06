import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { Creature } from "../Creature"

export class Frank extends Character {
    baseAttackSpeed = 1.25
    baseApeed = 80
    baseAttackDamage = 13
    baseAttackRange = 1
    baseMaxHealth = 500
    baseResistance: number = 10

    baseMaxMana: number = 0
    baseAbilityPower: number = 30
    manaLocked: boolean = true
    attacksCount = 0

    abilityName: string = "Dreno"

    constructor(scene: Game, id: string) {
        super(scene, "frank", id)
    }

    override getAbilityDescription(): string {
        return `Cada [primary.main:3º ataque] drena [info.main:${Math.round(this.abilityPower * 0.3)} (30% AP)] de vida do alvo.`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 6
        this.extractAnimationsFromSpritesheet("attacking", 52, 8)
    }

    override getAttackingAnimation(): string {
        return `attacking`
    }

    // levelUp(): void {
    //     super.levelUp()

    //     this.baseAttackDamage += 10
    // }

    override landAttack() {
        super.landAttack()
        this.attacksCount += 1

        if (!this.target) {
            return
        }

        if (this.attacksCount === 3) {
            this.attacksCount = 0
            this.drainLife(this.target)
        }
    }

    drainLife(target: Creature) {
        const damage = this.calculateDamage(this.abilityPower * 0.3)
        target.takeDamage(damage.value, this, "poison", damage.crit)
        this.heal(damage.value, damage.crit)
    }

    override refreshStats(): void {
        super.refreshStats()
        this.attacksCount = 0
    }
}
