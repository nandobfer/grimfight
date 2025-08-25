import { DamageType } from "../ui/DamageNumbers";
import { StatusEffect, StatusEffectParams } from "./StatusEffect";

export interface DotParams extends StatusEffectParams {
    tickDamage: number
    damageType: DamageType
}

export class Dot extends StatusEffect {
    tickDamage: number
    damageType: DamageType

    constructor(params: DotParams) {
        super(params)
        this.tickDamage = params.tickDamage
        this.damageType = params.damageType
    }

    override tick() {
        const {damage, crit} = this.user.calculateDamage(this.tickDamage)
        console.log(damage)
        this.target.takeDamage(damage, this.user, this.damageType, crit)
    }
}