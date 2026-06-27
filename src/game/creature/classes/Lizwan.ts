import { PoisonAttack } from "../../fx/PoisonAttack"
import { Dot } from "../../objects/StatusEffect/Dot"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Lizwan extends Character {
    baseAttackSpeed = 1.5
    baseSpeed = 130
    baseAttackDamage = 15
    baseCritChance = 20
    baseMaxMana: number = 60

    abilityName = "Deadly Poison"
    private readonly catalyticPoisonDamageRatio = 0.3
    private readonly catalyticPoisonSource = "Veneno Catalisador"

    constructor(scene: Game, id: string) {
        super(scene, "lizwan", id)
    }

    override getAbilityDescription(): string {
        return `Attacks apply a stack of deadly poison. The poison deals [info.main:${Math.round(
            this.abilityPower * 0.05
        )} (5% AP)] damage per second. Lasts 10 seconds and [primary.main:stacks indefinitely]. On cast, catalyzes poison on the target, dealing [info.main:${Math.round(
            this.catalyticPoisonDamageRatio * 100
        )}%] of the remaining poison damage.`
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
            abilityName: this.abilityName,
        })
        poison.start()
    }

    override castAbility(multiplier = 1): boolean | void {
        if (!this.target?.active) return false

        const remainingPoisonDamage = [...this.target.statusEffects]
            .filter((effect): effect is Dot => effect instanceof Dot && effect.damageType === "poison")
            .reduce((total, poison) => total + poison.getRemainingRawDamage(), 0)

        if (remainingPoisonDamage <= 0) return false

        const damage = remainingPoisonDamage * this.catalyticPoisonDamageRatio * multiplier
        this.target.takeDamage(damage, this, "poison", false, true, this.catalyticPoisonSource)
    }
}
