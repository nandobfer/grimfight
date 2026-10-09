import { IagoWhirlwindFx } from "../../fx/IagoWhirlwindFx"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import {
    iagoDestinyCritBonus,
    iagoEffectiveCritChance,
    iagoRollsWhirlwind,
    iagoWhirlwindDamage,
    iagoWhirlwindProcChance,
    iagoWhirlwindAngle,
    IAGO_WHIRLWIND_AD_RATIO,
    IAGO_WHIRLWIND_AP_RATIO,
    IAGO_WHIRLWIND_DIE_FACES,
} from "./IagoDice"

/**
 * Iago — a mana-locked auto attacker (like Statikk) whose power lives in two
 * passives triggered on his basic attacks.
 */
export class Iago extends Character {
    baseAttackSpeed = 1.2
    baseAttackDamage = 22
    baseAttackRange = 1
    baseMaxHealth = 380
    baseMaxMana = 0
    manaLocked = true
    baseCritChance = 10
    baseSpeed = 60

    abilityName = "Steel Tempest"

    constructor(scene: Game, id: string) {
        super(scene, "iago", id)
    }

    override getAbilityDescription(): string {
        const crit = Math.round(iagoEffectiveCritChance(this.critChance, this.destinyRolls))
        const proc = Math.round(iagoWhirlwindProcChance(this.destinyRolls))
        const adPart = Math.round(this.attackDamage * IAGO_WHIRLWIND_AD_RATIO)
        const apPart = Math.round(this.abilityPower * IAGO_WHIRLWIND_AP_RATIO)
        const adRatio = Math.round(IAGO_WHIRLWIND_AD_RATIO * 100)
        const apRatio = Math.round(IAGO_WHIRLWIND_AP_RATIO * 100)

        return `Passive: his critical chance is guided by fate — the Destiny roll raises it to [primary.main:${crit}%]. On every basic attack he also rolls a [primary.main:d20] through the same fate flow, so a [primary.main:20] grows more likely with more fate rolls ([primary.main:${proc}%]); it sends a wind whirlwind straight forward, dealing [error.main:${adPart} (${adRatio}% AD)] plus [info.main:${apPart} (${apRatio}% AP)] to every enemy it crosses.`
    }

    /** Passive 1: the Destiny roll raises his critical chance. */
    override tryCrit(bonus = 0): boolean {
        const destinyBonus = iagoDestinyCritBonus(this.critChance + bonus, this.destinyRolls)
        return super.tryCrit(bonus + destinyBonus)
    }

    /** Passive 2: each basic attack rolls a d20 through the fate flow; a 20 unleashes the whirlwind. */
    override landAttack(): void {
        super.landAttack()

        const target = this.target
        if (!this.active || !target?.active) return

        const roll = this.rollDestiny(IAGO_WHIRLWIND_DIE_FACES)
        if (!iagoRollsWhirlwind(roll)) return

        const angle = iagoWhirlwindAngle(this.x, this.y, target.x, target.y)
        new IagoWhirlwindFx(this, angle, iagoWhirlwindDamage(this.attackDamage, this.abilityPower), this.abilityName)
    }
}
