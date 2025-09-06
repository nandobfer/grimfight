import { Creature } from "../creature/Creature"

export interface StatusEffectParams {
    target: Creature
    user: Creature
    duration: number
    tickRate: number
}

export class StatusEffect {
    target: Creature
    user: Creature
    duration: number
    tickRate: number
    timeSinceLastTick = 0
    totalTimePassed = 0

    constructor(params: StatusEffectParams) {
        this.target = params.target
        this.user = params.user
        this.duration = params.duration
        this.tickRate = params.tickRate
    }

    update(delta: number) {
        this.timeSinceLastTick += delta
        this.totalTimePassed += delta

        if (this.timeSinceLastTick >= this.tickRate) {
            this.tick()
            this.timeSinceLastTick = 0
        }

        if (this.totalTimePassed >= this.duration) {
            this.expire()
            return
        }
    }

    tick() { }
    
    expire() {
        this.target.statusEffects.delete(this)
    }
}
