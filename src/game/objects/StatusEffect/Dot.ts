import { DamageType } from "../../ui/DamageNumbers";
import { StatusEffect, StatusEffectParams } from "./StatusEffect";

export interface DotParams extends StatusEffectParams {
    tickDamage: number
    tickRate: number
    damageType: DamageType
}

export class Dot extends StatusEffect {
    tickDamage: number
    damageType: DamageType
    tickRate: number
    timeSinceLastTick = 0

    constructor(params: DotParams) {
        super(params)
        this.tickDamage = params.tickDamage
        this.damageType = params.damageType
        this.tickRate = params.tickRate
    }

    tick() {
        const { value: damage, crit } = this.user.calculateDamage(this.tickDamage)
        this.target.takeDamage(damage, this.user, this.damageType, crit)
    }

    override update(delta: number): void {
        super.update(delta)

        this.timeSinceLastTick += delta
        

        if (this.timeSinceLastTick >= this.tickRate) {
            this.tick()
            this.timeSinceLastTick = 0
        }

        
    }
}