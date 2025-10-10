import { StatusEffect, StatusEffectParams } from "./StatusEffect"

export interface HotParams extends StatusEffectParams {
    value: number
    tickRate: number
    abilityName: string
    valueType: "total" | "perTick"
}

export class Hot extends StatusEffect {
    value: number
    tickRate: number
    valueType: "total" | "perTick"
    timeSinceLastTick = 0
    abilityName: string

    constructor(params: HotParams) {
        super(params)
        this.duration = params.duration + 100
        this.value = params.value
        this.tickRate = params.tickRate
        this.abilityName = params.abilityName
        this.valueType = params.valueType
        this.timeSinceLastTick = this.tickRate
    }

    tick() {
        const { value, crit } = this.user.calculateDamage(this.valueType === "perTick" ? this.value : this.value / (this.duration / this.tickRate))
        this.target.heal(value, crit, false, { healer: this.user, source: this.abilityName })
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
