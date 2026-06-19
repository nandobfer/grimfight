import { Creature } from "../../creature/Creature"
import { MelisandreFireAura } from "../../fx/MelisandreFireAura"
import { StatusEffect } from "./StatusEffect"

export class FireEmpowerment extends StatusEffect {
    private readonly attackSpeedPercent: number
    private readonly damageApRatio: number
    private attackSpeedBonus = 0
    private expired = false
    private aura?: MelisandreFireAura

    private readonly onAfterAttack = (victim?: Creature) => {
        if (!victim?.active || !this.user.active) return

        const { value, crit } = this.user.calculateDamage(this.user.abilityPower * this.damageApRatio)
        victim.takeDamage(value, this.target, "fire", crit, false, this.user.abilityName)
    }

    private readonly onGameState = (state: string) => {
        if (state === "idle") {
            this.expire()
        }
    }

    constructor(target: Creature, user: Creature, duration: number, attackSpeedPercent: number, damageApRatio: number) {
        super({ target, user, duration })
        this.attackSpeedPercent = attackSpeedPercent
        this.damageApRatio = damageApRatio
    }

    static apply(target: Creature, user: Creature, duration: number, attackSpeedPercent: number, damageApRatio: number): void {
        const activeEmpowerment = [...target.statusEffects].find(
            (effect): effect is FireEmpowerment => effect instanceof FireEmpowerment && effect.user === user
        )

        if (activeEmpowerment) {
            activeEmpowerment.resetDuration()
            return
        }

        new FireEmpowerment(target, user, duration, attackSpeedPercent, damageApRatio).start()
    }

    override onApply(): void {
        super.onApply()

        this.attackSpeedBonus = this.target.attackSpeed * this.attackSpeedPercent
        this.target.attackSpeed += this.attackSpeedBonus
        this.target.on("afterAttack", this.onAfterAttack)
        this.target.scene.events.on("gamestate", this.onGameState)

        this.aura = new MelisandreFireAura(this.target)
        this.aura.update(this.totalTimePassed)
    }

    override update(delta: number): void {
        super.update(delta)
        this.aura?.update(this.totalTimePassed)
    }

    override expire(): void {
        if (this.expired) return
        this.expired = true
        super.expire()
    }

    override onExpire(): void {
        super.onExpire()

        this.target.attackSpeed -= this.attackSpeedBonus
        this.target.off("afterAttack", this.onAfterAttack)
        this.target.scene.events.off("gamestate", this.onGameState)
        this.aura?.destroy()
        this.aura = undefined
    }
}
