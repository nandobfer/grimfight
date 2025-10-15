import { HolyHeal } from "../../fx/HolyHeal"
import { MagicShieldFx } from "../../fx/MagicShieldFx"
import { HolyShield } from "../../objects/Projectile/HolyShield"
import { Game } from "../../scenes/Game"
import { GuardianAura } from "../../systems/Aura/GuardianAura"
import { PaladinAura } from "../../systems/Aura/PaladinAura"
import { ProtectionAura } from "../../systems/Aura/ProtectionAura"
import { SmiteAura } from "../../systems/Aura/SmiteAura"
import { Character } from "../character/Character"

export class Lalatina extends Character {
    baseAttackSpeed = 0.75
    baseAttackDamage = 30
    baseMaxMana: number = 135
    baseMaxHealth: number = 500

    abilityName: string = "Avenging Shield"
    aura: PaladinAura
    previousPlacement: "front" | "middle" | "back" | null = null

    constructor(scene: Game, id: string) {
        super(scene, "lalatina", id)

        // Listen for move events to detect placement changes
        this.once("destroy", () => {
            if (this.team && this.aura) {
                this.team.removeAura(this.aura)
            }
        })
    }

    override getAbilityDescription(): string {
        return `Lalatina hurls her shield at the target, dealing [info.main:${Math.round(
            this.attackDamage * 0.5 + this.abilityPower * 0.5
        )} (50% AP)] [error.main:(50% AD)] holy damage. Bounces 2 times. Also trigger her aura's vow.

Passive: Lalatina grants the team a different aura, based on her starting position.

Front - Protection Aura: Grant 15% armor to all allies. Vow: Grants a shield to nearby allies, absorbing [info.main:${Math.round(
            this.abilityPower * 0.3
        )} (30% AP)].

Middle - Smite Aura: When an ally deals critical damage, they smite, dealing [info.main:${Math.round(
            this.abilityPower * 0.5
        )} (50% AP)] additional holy damage. Vow: Avenging Shield always hits critically and enemies hit burn for [error.main:${Math.round(
            this.attackDamage * 0.5
        )} (50% AD)] over 5 seconds.

Back - Guardian Aura: When an ally is healed, they gain a shield equal to part of the amount healed [info.main: (30% AP * healing value)]. Vow: Heal the lowest health ally for [info.main:${Math.round(
            this.abilityPower * 1.75
        )} (175% AP)].`
    }

    override getAttackingAnimation(): string {
        return `attacking`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 4
        const attacking = this.extractAnimationsFromSpritesheet("attacking", 1, 5, 6, "lalatina_attacking")

        const onUpdate = (animation: Phaser.Animations.Animation) => {
            if (attacking.find((anim) => anim.key === animation.key)) {
                this.setOrigin(0.5, 0.6)
                this.body.setOffset(64, 64)
            } else {
                this.setOrigin(0.5, 0.75)
                this.body.setOffset(0, 0)
            }
        }

        this.on("animationstart", onUpdate)
        this.once("destroy", () => this.off("animationstart", onUpdate))
    }

    override castAbility(): void {
        if (!this.target) {
            return
        }

        this.casting = true

        try {
            const shield = new HolyShield(this.scene, this.x, this.y, this).fire(this.target)
            const placement = this.getPlacement()

            switch (placement) {
                case "front":
                    const allies = this.getAlliesInRange(100)
                    allies.push(this)
                    allies.forEach((ally) => {
                        new MagicShieldFx(this.scene, ally.x, ally.y, 0.4)
                        ally.gainShield(this.abilityPower * 0.3, { healer: this, source: this.abilityName })
                    })
                    break
                case "middle":
                    shield.applyBurn = true
                    shield.critGuaranteed = true
                    break
                case "back":
                    const ally = this.team.getLowestHealth()
                    if (ally) {
                        new HolyHeal(this.scene, ally.x, ally.y)
                        ally.heal(this.abilityPower * 1.75, { healer: this, source: this.abilityName })
                    }
                    break
            }
        } catch (error) {}

        this.casting = false
    }

    override onPlacementChange() {
        const currentPlacement = this.getPlacement()
        if (currentPlacement) {
            this.previousPlacement = currentPlacement
            this.applyAura(currentPlacement)
        }
    }

    applyAura(placement: "front" | "middle" | "back") {
        if (!this.team) return

        if (this.aura) {
            this.team.removeAura(this.aura)
        }

        switch (placement) {
            case "front":
                this.aura = new ProtectionAura(this)
                break
            case "middle":
                this.aura = new SmiteAura(this)
                break
            case "back":
                this.aura = new GuardianAura(this)
                break
        }

        // Only add the aura if it exists
        if (this.aura) {
            this.team.addAura(this.aura)
            this.team.refreshAllStats()
        }
    }

    override refreshStats(): void {
        super.refreshStats()

        // Check placement on first refresh if not set yet
        if (!this.previousPlacement) {
            this.onPlacementChange()
        }

        this.mana *= this.maxMana * 0.65
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)
    }
}
