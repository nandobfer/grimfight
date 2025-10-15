import { DamageType } from "../../ui/DamageNumbers"
import { StatusEffect, StatusEffectParams } from "./StatusEffect"

export interface DotParams extends StatusEffectParams {
    tickDamage: number
    tickRate: number
    damageType: DamageType
    abilityName: string
    onTick?: (damage: number) => void
}

export class Dot extends StatusEffect {
    tickDamage: number
    damageType: DamageType
    tickRate: number
    timeSinceLastTick = 0
    abilityName: string

    onTick?: (damage: number) => void

    constructor(params: DotParams) {
        super(params)
        this.tickDamage = params.tickDamage
        this.damageType = params.damageType
        this.tickRate = params.tickRate
        this.abilityName = params.abilityName
        this.timeSinceLastTick = this.tickRate
        this.onTick = params.onTick
    }

    tick() {
        const { value: damage, crit } = this.user.calculateDamage(this.tickDamage)
        this.target.takeDamage(damage, this.user, this.damageType, crit, true, this.abilityName)

        this.onTick?.(damage)
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
