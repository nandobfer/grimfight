import { Creature } from "../../creature/Creature"

export interface StatusEffectParams {
    target: Creature
    user: Creature
    duration: number
    onExpire?: Function
}

export class StatusEffect {
    target: Creature
    user: Creature
    duration: number
    onAfterExpire?: Function

    totalTimePassed = 0

    constructor(params: StatusEffectParams) {
        this.target = params.target
        this.user = params.user
        this.duration = params.duration
        this.onAfterExpire = params.onExpire
    }

    onApply() {}
    onExpire() {
        if (this.onAfterExpire) {
            this.onAfterExpire()
        }
    }

    update(delta: number) {
        this.totalTimePassed += delta
        if (this.totalTimePassed >= this.duration) {
            this.expire()
            return
        }
    }

    expire() {
        this.target.statusEffects.delete(this)
        this.target.off("died", this.expire, this)
        this.target.off("destroy", this.expire, this)
        this.onExpire()
    }

    resetDuration() {
        this.totalTimePassed = 0

        if (!this.target.statusEffects.has(this)) {
            this.start()
        }
    }

    start() {
        this.target.statusEffects.add(this)
        this.onApply()

        this.target.once("died", this.expire, this)
        this.target.once("destroy", this.expire, this)
    }
}
