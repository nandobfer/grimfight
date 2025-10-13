import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { Creature } from "../Creature"

export class Frank extends Character {
    baseAttackSpeed = 1.25
    baseAttackDamage = 13
    baseAttackRange = 1
    baseMaxHealth = 500
    baseArmor: number = 10

    baseMaxMana: number = 0
    manaLocked: boolean = true
    attacksCount = 0

    abilityName: string = "Life Drain"

    constructor(scene: Game, id: string) {
        super(scene, "frank", id)
    }

    override getAbilityDescription(): string {
        return `Every [primary.main:3rd attack] drains [info.main:${Math.round(this.abilityPower * 0.4)} (40% AP)] health from the target.`
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
        const damage = this.calculateDamage(this.abilityPower * 0.4)
        target.takeDamage(damage.value, this, "poison", damage.crit, true, this.abilityName)
        this.heal(damage.value, { healer: this, source: this.abilityName })
    }

    override refreshStats(): void {
        super.refreshStats()
        this.attacksCount = 0
    }
}
