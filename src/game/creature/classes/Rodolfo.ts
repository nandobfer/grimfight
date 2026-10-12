import { RodolfoChainLightningFx } from "../../fx/RodolfoChainLightningFx"
import { RodolfoNukeFx } from "../../fx/RodolfoNukeFx"
import { EarthDrill } from "../../objects/Projectile/EarthDrill"
import { WaterOrb } from "../../objects/Projectile/WaterOrb"
import { Game } from "../../scenes/Game"
import { Creature } from "../Creature"
import { Character } from "../character/Character"
import {
    orderRodolfoChainTargets,
    resolveRodolfoOutcome,
    rodolfoChainDamage,
    rodolfoOutcomeChance,
    rodolfoOutcomeDamage,
    RODOLFO_CHAIN_TARGETS,
    RODOLFO_NUKE_RADIUS,
    RODOLFO_OUTCOME_AP_RATIO,
    RODOLFO_OUTCOME_NAME,
    RODOLFO_OUTCOMES,
    RODOLFO_WATER_SPLASH_RADIUS,
    RODOLFO_WATER_SPLASH_RATIO,
    type RodolfoOutcome,
} from "./RodolfoDestiny"

export class Rodolfo extends Character {
    baseAttackSpeed = 0.5
    baseAttackDamage = 12
    baseAttackRange = 3
    baseManaPerSecond = 10
    baseMaxMana = 100
    baseMaxHealth = 200

    abilityName = "Fate Sorcery"

    constructor(scene: Game, id: string) {
        super(scene, "rodolfo", id)
    }

    override getAbilityDescription(): string {
        const rows = RODOLFO_OUTCOMES.map((outcome) => {
            const chance = Math.round(rodolfoOutcomeChance(outcome, this.destinyRolls) * 100)
            const damage = Math.round(rodolfoOutcomeDamage(this.abilityPower, outcome))
            const ratio = Math.round(RODOLFO_OUTCOME_AP_RATIO[outcome] * 100)

            return `[info.main:${chance}%] | [primary.main:${RODOLFO_OUTCOME_NAME[outcome]}] | [info.main:${damage} (${ratio}% AP)]`
        })

        return `Rolls the threads of fate to cast one of four spells:

[primary.main:Chance] | [primary.main:Spell] | [primary.main:Damage]
${rows.join("\n")}

[primary.main:Chain Lightning] links up to [info.main:${RODOLFO_CHAIN_TARGETS}] enemies, hitting softer with each jump. The [primary.main:Water Orb] splashes foes around its mark.`
    }

    override landAttack(): void {
        if (!this.target?.active || !this.active) return

        new WaterOrb(this.scene, this.x, this.y - 12, this).fire(this.target)
    }

    override castAbility(multiplier = 1): boolean | void {
        if (!this.active || this.casting) return false

        const target = this.pickFateTarget()
        if (!target) {
            this.target = undefined
            return false
        }

        this.casting = true
        this.target = target
        this.updateFacingDirection()
        this.playCastingAnimation()

        const roll = this.rollDestiny(100)
        const outcome = resolveRodolfoOutcome(roll)
        this.executeFate(outcome, target, multiplier)

        this.casting = false
    }

    private pickFateTarget(): Creature | undefined {
        if (this.target?.active && this.target.canBeTargeted) return this.target

        let closest: Creature | undefined
        let closestDistance = Infinity

        for (const enemy of this.getEnemyTeam().getChildren(true, true)) {
            if (!enemy.active || !enemy.canBeTargeted) continue

            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
            if (distance < closestDistance) {
                closest = enemy
                closestDistance = distance
            }
        }

        return closest
    }

    private executeFate(outcome: RodolfoOutcome, target: Creature, multiplier: number): void {
        switch (outcome) {
            case "water": {
                const damage = rodolfoOutcomeDamage(this.abilityPower, "water", multiplier)
                new WaterOrb(this.scene, this.x, this.y - 12, this, {
                    scale: 1.5,
                    damage,
                    splashDamage: damage * RODOLFO_WATER_SPLASH_RATIO,
                    splashRadius: RODOLFO_WATER_SPLASH_RADIUS,
                    source: RODOLFO_OUTCOME_NAME.water,
                }).fire(target)
                break
            }
            case "drill": {
                const damage = rodolfoOutcomeDamage(this.abilityPower, "drill", multiplier)
                new EarthDrill(this.scene, this.x, this.y - 12, this, damage, RODOLFO_OUTCOME_NAME.drill).fire(target)
                break
            }
            case "chain": {
                const damage = rodolfoOutcomeDamage(this.abilityPower, "chain", multiplier)
                const others = this.getEnemyTeam()
                    .getChildren(true, true)
                    .filter((enemy) => enemy.active && enemy.canBeTargeted && enemy !== target)
                const candidates = others.map((enemy) => ({ target: enemy, x: enemy.x, y: enemy.y }))
                const ordered = orderRodolfoChainTargets({ x: target.x, y: target.y }, candidates, RODOLFO_CHAIN_TARGETS - 1)

                new RodolfoChainLightningFx(this, [target, ...ordered], RODOLFO_OUTCOME_NAME.chain, (jump) =>
                    rodolfoChainDamage(damage, jump)
                )
                break
            }
            case "nuke": {
                const damage = rodolfoOutcomeDamage(this.abilityPower, "nuke", multiplier)
                new RodolfoNukeFx(this, target.x, target.y, damage, RODOLFO_NUKE_RADIUS, RODOLFO_OUTCOME_NAME.nuke)
                break
            }
        }
    }

    private playCastingAnimation(): void {
        const key = `${this.getAnimationTextureName()}-casting-${this.facing}`
        this.play({ key, frameRate: 14, repeat: 0 }, true)
    }

    override refreshStats(): void {
        super.refreshStats()
        this.gainMana(this.maxMana * 0.7)
    }
}
