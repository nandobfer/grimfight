import type { DamageType } from "../../ui/DamageNumbers"
import { calculateRemainingDotDamage } from "./DotDamage"
import { StatusEffect, type StatusEffectParams } from "./StatusEffect"

export interface DotParams extends StatusEffectParams {
    tickDamage: number
    tickRate: number
    damageType: DamageType
    abilityName: string
    emitDamageEvents?: boolean
    onTick?: (damage: number) => void
}

export class Dot extends StatusEffect {
    tickDamage: number
    damageType: DamageType
    tickRate: number
    timeSinceLastTick = 0
    abilityName: string
    emitDamageEvents: boolean

    onTick?: (damage: number) => void

    constructor(params: DotParams) {
        super(params)
        this.tickDamage = params.tickDamage
        this.damageType = params.damageType
        this.tickRate = params.tickRate
        this.abilityName = params.abilityName
        this.emitDamageEvents = params.emitDamageEvents ?? true
        this.timeSinceLastTick = this.tickRate
        this.onTick = params.onTick
    }

    tick() {
        const { value: damage, crit } = this.user.calculateDamage(this.tickDamage)
        this.target.takeDamage(damage, this.user, this.damageType, crit, this.emitDamageEvents, this.abilityName)

        this.onTick?.(damage)
    }

    getRemainingRawDamage(): number {
        return calculateRemainingDotDamage({
            duration: this.duration,
            totalTimePassed: this.totalTimePassed,
            tickDamage: this.tickDamage,
            tickRate: this.tickRate,
        })
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
