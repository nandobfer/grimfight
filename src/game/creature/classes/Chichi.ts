import { FireEffect } from "../../fx/FireEffect"
import { Fireball } from "../../objects/Projectile/Fireball"
import { Hot } from "../../objects/StatusEffect/Hot"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { Creature } from "../Creature"

export class Chichi extends Character {
    baseAttackSpeed = 1
    baseAttackDamage = 30
    baseMaxMana = 150
    baseAttackRange = 1
    baseMaxHealth: number = 500

    abilityName = "Ki Clone"
    clone: Chichi | undefined = undefined
    healingBeam?: Phaser.GameObjects.Graphics
    renewingMist: Hot | undefined = undefined

    constructor(scene: Game, id: string) {
        super(scene, "chichi", id)
        // this.createAnimations()
    }

    override getAbilityDescription(): string {
        return `Summons a ki clone to fight by your side. The clone has 50% of your health, but cannot use abilities. Lasts for 5 seconds.

Front: The clone taunts your target and your attacks heals it for [success.main:${Math.round(this.abilityPower * 0.1)} (10% AP) (Enveloping Mist)].

Middle: The clone dashes towards the fartest enemy, targeting it. Your attacks makes it launch a Ki Orb at your target, dealing [error.main:${Math.round(
            this.abilityPower * 0.5 + this.attackDamage * 1
        )} (100% AD)] [info.main:(50% AP)] damage.

Back: The clone channels [success.main:Renewing Mist] at the ally with the lowest health, healing them for [success.main:${Math.round(
            this.abilityPower * 1.5
        )}] [info.main:(150% AP)] over 5 seconds. Your attacks triggers [success.main:Vivify] on that ally, instantly healing them for [success.main:${Math.round(
            this.abilityPower * 0.15
        )}] [info.main:(15% AP)].`
    }

    createHealingBeam(target: Creature) {
        if (this.healingBeam) {
            this.healingBeam.destroy()
        }

        this.healingBeam = this.scene.add.graphics()
        this.healingBeam.setDepth(this.depth + 1)
        this.healingBeam.setBlendMode(Phaser.BlendModes.ADD)
        this.scene.perRoundFx.add(this.healingBeam)

        // Animate the beam with a pulsing effect
        this.scene.tweens.add({
            targets: this.healingBeam,
            alpha: { from: 0.8, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        })

        this.renewingMist = new Hot({
            abilityName: "Renewing Mist",
            duration: 5000,
            value: this.abilityPower * 1.5,
            tickRate: 200,
            target: target,
            user: this.master || this,
            valueType: "total",
        })
        this.renewingMist.start()
    }

    updateHealingBeam(target: Creature) {
        if (!this.healingBeam || !target.active) return

        this.healingBeam.clear()

        // Draw a soft green healing beam
        const startX = this.x
        const startY = this.y - 20
        const endX = target.x
        const endY = target.y - 20

        // Main beam
        this.healingBeam.lineStyle(9, 0x00ff88, 0.8)
        this.healingBeam.lineBetween(startX, startY, endX, endY)

        // Inner bright core
        this.healingBeam.lineStyle(6, 0x88ffaa, 1)
        this.healingBeam.lineBetween(startX, startY, endX, endY)

        // Outer glow
        this.healingBeam.lineStyle(15, 0x00ff44, 0.3)
        this.healingBeam.lineBetween(startX, startY, endX, endY)
    }

    destroyHealingBeam() {
        if (this.healingBeam) {
            this.healingBeam.destroy()
            this.healingBeam = undefined
        }

        this.renewingMist?.expire()
        this.renewingMist = undefined
    }

    override castAbility(): void {
        this.casting = true

        this.clone = this.makeClone()
        this.manaLocked = true

        this.scene.time.delayedCall(5000, () => {
            if (this.clone) {
                this.clone.destroyHealingBeam()
                this.clone.destroy(true)
                this.clone = undefined

                this.wipeCheck()
            }

            this.manaLocked = false
            this.landAttack = super.landAttack.bind(this)
        })

        const placement = this.getPlacement()

        switch (placement) {
            case "front":
                if (this.target) {
                    this.clone.target = this.target
                    this.target.target = this.clone
                }

                this.landAttack = this.tankAttack.bind(this)
                break
            case "middle":
                const target = this.getFartestEnemy()
                if (target) {
                    const position = target.randomPointAround()
                    this.clone.dashTo(position.x, position.y)
                    this.clone.target = target
                }
                this.landAttack = this.dpsAttack.bind(this)
                break

            case "back":
                this.landAttack = this.healerAttack.bind(this)
                this.clone.newTarget = this.clone.newHealerTarget.bind(this.clone)
                this.clone.withTargetUpdate = this.clone.healerUpdate.bind(this.clone)

                this.clone.startChanneling()
                this.clone.teleportTo(this.boardX, this.boardY)
                this.clone.glowTemporarily(0x00ff88, 5, 4500)
                
                // Set initial target for healing
                this.clone.target = this.clone.newHealerTarget()

                break
        }

        this.casting = false
    }

    tankAttack() {
        super.landAttack()

        if (this.clone) {
            const { value, crit } = this.calculateDamage(this.abilityPower * 0.1)
            this.clone.heal(value, crit, false, { healer: this, source: "Enveloping Mist" })
        }
    }

    dpsAttack() {
        super.landAttack()

        if (this.clone) {
            const { x, y } = this.clone.randomPointAround()
            const fireball = new Fireball(this.scene, this.clone.x, this.clone.y, this.clone)
            const orb = new FireEffect(this.scene, x, y)
            orb.setScale(0.075)
            orb.setOrigin(0.5, 0.5)
            orb.setTint(0x00ff88)
            fireball.setTint(0x00ff88)

            this.scene.perRoundFx.add(orb)
            this.scene.tweens.add({ targets: orb, duration: 45, angle: 360, repeat: -1, yoyo: false })

            fireball.onHit = (target) => {
                fireball.destroy(true)
                const { value, crit } = this.calculateDamage(this.abilityPower * 0.5 + this.attackDamage * 1)
                target.takeDamage(value, this, "normal", crit, true, "Ki Orb")
            }

            this.scene.time.delayedCall(Phaser.Math.FloatBetween(200, 800), () => {
                if (!this.target) return
                orb.destroy(true)
                fireball.fire(this.target, x, y)
            })
        }
    }

    healerAttack() {
        super.landAttack()

        if (this.clone?.target) {
            const { value, crit } = this.calculateDamage(this.abilityPower * 0.15)
            this.clone.target.heal(value, crit, false, { healer: this, source: "Vivify" })
        }
    }

    newHealerTarget() {
        return this.master?.team.getLowestHealth() || undefined
    }

    healerUpdate() {
        if (this.target && this.target.active && this.target.health < this.target.maxHealth) {
            if (!this.healingBeam) {
                this.createHealingBeam(this.target)
            }
            this.updateHealingBeam(this.target)
        } else {
            this.destroyHealingBeam()
            this.target = this.newHealerTarget()
        }
    }

    makeClone() {
        const clone = new Chichi(this.scene, this.id + "_clone")
        clone.master = this
        clone.setAlpha(0.4)
        clone.levelUpTo(this.level)
        const { x, y } = this.randomPointAround()
        clone.boardX = this.boardX
        clone.boardY = this.boardY
        clone.teleportTo(x, y)
        this.team.minions.add(clone)
        clone.reset()

        clone.addStatPercent("maxHealth", -50)
        clone.addStatPercent("health", -50)

        clone.attackDamage = this.attackDamage
        clone.abilityPower = this.abilityPower
        clone.armor = this.armor
        clone.attackSpeed = this.attackSpeed
        clone.speed = this.speed
        clone.attackRange = this.attackRange
        clone.critChance = this.critChance
        clone.critDamageMultiplier = this.critDamageMultiplier
        clone.manaLocked = true
        clone.maxMana = 0
        clone.mana = 0

        return clone
    }

    override refreshStats(): void {
        super.refreshStats()

        this.mana = this.maxMana * 0.35
    }
}
