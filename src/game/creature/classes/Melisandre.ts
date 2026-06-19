import { Fireball } from "../../objects/Projectile/Fireball"
import { FireEmpowerment } from "../../objects/StatusEffect/FireEmpowerment"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

const fireEmpowermentDuration = 3000
const fireEmpowermentTargets = 3
const fireEmpowermentAttackSpeedPercent = 0.5
const fireEmpowermentDamageApRatio = 0.2

export class Melisandre extends Character {
    baseAttackSpeed = 0.5
    baseAttackRange = 3
    baseManaPerSecond = 10
    baseMaxMana = 120
    baseMaxHealth = 220

    abilityName = "Fire Empowerment"

    constructor(scene: Game, id: string) {
        super(scene, "melisandre", id)
    }

    override getAbilityDescription(): string {
        return `Empowers the [info.main:${fireEmpowermentTargets}] allies with the lowest health for [info.main:3 seconds], granting [warning.main:50% attack speed] and causing attacks to deal [error.main:${Math.round(
            this.abilityPower * fireEmpowermentDamageApRatio
        )} (20% AP)] bonus fire damage.`
    }

    override landAttack() {
        if (!this.target || !this.active) return

        new Fireball(this.scene, this.x, this.y, this).fire(this.target)
    }

    override castAbility(): void {
        this.casting = true

        const targets = Phaser.Utils.Array.Shuffle([...this.team.getChildren(true, true)])
            .sort((a, b) => a.health / a.maxHealth - b.health / b.maxHealth)
            .slice(0, fireEmpowermentTargets)

        for (const target of targets) {
            FireEmpowerment.apply(
                target,
                this,
                fireEmpowermentDuration,
                fireEmpowermentAttackSpeedPercent,
                fireEmpowermentDamageApRatio
            )
        }

        this.casting = false
    }

    override refreshStats(): void {
        super.refreshStats()
        this.gainMana(this.maxMana * 0.5)
    }
}
