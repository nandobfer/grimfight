import { PoisonAttack } from "../../fx/PoisonAttack"
import { Dot } from "../../objects/StatusEffect/Dot"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Lizwan extends Character {
    baseAttackSpeed = 1.5
    baseSpeed = 130
    baseAttackDamage = 15
    baseCritChance = 20
    baseMaxMana: number = 0
    // baseMaxMana: number = 50
    manaLocked: boolean = true

    abilityName = "Deadly Poison"

    constructor(scene: Game, id: string) {
        super(scene, "lizwan", id)
    }

    override getAbilityDescription(): string {
        return `Attacks apply a stack of deadly poison. The poison deals [info.main:${Math.round(
            this.abilityPower * 0.05
        )} (5% AP)] damage per second. Lasts 10 seconds and [primary.main:stacks indefinitely].`
    }

    override landAttack(): void {
        super.landAttack()

        if (!this.target) {
            return
        }

        new PoisonAttack(this.scene, this.target.x, this.target.y)

        const poison = new Dot({
            damageType: "poison",
            duration: 10000,
            target: this.target,
            tickDamage: this.abilityPower * 0.05,
            tickRate: 1000,
            user: this,
        })
        poison.start()
    }

    override refreshStats(): void {
        super.refreshStats()
        // this.mana = this.maxMana * 0.9
    }
}
