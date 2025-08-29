import { PoisonAttack } from "../../fx/PoisonAttack"
import { Dot } from "../../objects/Dot"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Lizwan extends Character {
    baseAttackSpeed = 1.5
    baseSpeed = 130
    baseAttackDamage = 15
    baseCritChance = 20
    baseMaxMana: number = 0
    // baseMaxMana: number = 50
    baseAbilityPower: number = 25
    manaLocked: boolean = true

    abilityName = "Deadly Poison"

    constructor(scene: Game, id: string) {
        super(scene, "lizwan", id)
    }

    // override castAbility(): void {
    //     this.casting = true

    //     if (!this.target) {
    //         return
    //     }

    //     new PoisonAttack(this.scene, this.target.x, this.target.y)

    //     const poison = new Dot({
    //         damageType: "poison",
    //         duration: 10000,
    //         target: this.target,
    //         tickDamage: this.abilityPower * 0.3,
    //         tickRate: 1000,
    //         user: this,
    //     })
    //     this.target.applyStatusEffect(poison)

    //     this.casting = false
    // }

    override getAbilityDescription(): string {
        return `Ataques aplicam um acúmulo de veneno mortal.
O veneno causa [info.main:${Math.round(
            this.abilityPower * 0.1
        )} (10% AP)] de dano por segundo. Dura 10 segundos e [primary.main:acumula indefinidamente].`
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
            tickDamage: this.abilityPower * 0.1,
            tickRate: 1000,
            user: this,
        })
        this.target.applyStatusEffect(poison)
    }

    override refreshStats(): void {
        super.refreshStats()
        // this.mana = this.maxMana * 0.9
    }
}
