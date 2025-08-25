import { PoisonAttack } from "../../fx/PoisonAttack"
import { Dot } from "../../objects/Dot"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Lizwan extends Character {
    baseAttackSpeed = 1.5
    baseSpeed = 100
    baseAttackDamage = 15
    baseCritChance = 20
    baseMaxMana: number = 50

    constructor(scene: Game, id: string) {
        super(scene, "lizwan", id)
    }

    override castAbility(): void {
        this.casting = true

        if (!this.target) {
            return
        }

        new PoisonAttack(this.scene, this.target.x, this.target.y)

        const poison = new Dot({
            damageType: "poison",
            duration: 10000,
            target: this.target,
            tickDamage: this.abilityPower * 0.13,
            tickRate: 1000,
            user: this,
        })
        this.target.applyStatusEffect(poison)

        this.casting = false
    }

    override reset(): void {
        super.reset()
        // this.mana = this.maxMana * 0.9
    }
}
