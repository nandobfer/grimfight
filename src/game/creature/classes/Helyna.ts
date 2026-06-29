import { FxSprite } from "../../fx/FxSprite"
import { Heal } from "../../fx/Heal"
import { Arrow } from "../../objects/Projectile/Arrow"
import { Dot } from "../../objects/StatusEffect/Dot"
import { Hot } from "../../objects/StatusEffect/Hot"
import { Game } from "../../scenes/Game"
import type { Direction } from "../Creature"
import { Creature } from "../Creature"
import { Character } from "../character/Character"
import {
    calculateHelynaBearAttackDamage,
    calculateHelynaBearMaxHealth,
    calculateHelynaCatAttackDamage,
    calculateHelynaFrenziedRegenerationHealing,
    calculateHelynaRakeTickDamage,
    calculateHelynaRakeTotalDamage,
    calculateHelynaRegrowthHealing,
    calculateHelynaRejuvenationHealing,
    HELYNA_BEAR_ATTACK_DAMAGE_AP_RATIO,
    HELYNA_BEAR_MAX_HEALTH_AP_RATIO,
    HELYNA_CAT_ATTACK_DAMAGE_AP_RATIO,
    HELYNA_CAT_ATTACK_SPEED_MULTIPLIER,
    HELYNA_CAT_CRIT_CHANCE_AP_RATIO,
    HELYNA_CAT_SPEED_MULTIPLIER,
    HELYNA_ENERGY_MAX,
    HELYNA_ENERGY_REGEN_PER_SECOND,
    HELYNA_FRENZIED_REGENERATION_AP_RATIO,
    HELYNA_FRENZIED_REGENERATION_DURATION_MS,
    HELYNA_FRENZIED_REGENERATION_HEALTH_THRESHOLD,
    HELYNA_FRENZIED_REGENERATION_MAX_HEALTH_RATIO,
    HELYNA_FRENZIED_REGENERATION_RAGE_COST,
    HELYNA_FRENZIED_REGENERATION_TICK_RATE_MS,
    HELYNA_HUMAN_REGROWTH_AP_RATIO,
    HELYNA_HUMAN_REJUVENATION_AP_RATIO,
    HELYNA_RAGE_MAX,
    HELYNA_RAKE_COOLDOWN_MS,
    HELYNA_RAKE_ATTACK_DAMAGE_RATIO,
    HELYNA_RAKE_DURATION_MS,
    HELYNA_RAKE_ENERGY_COST,
    HELYNA_RAKE_TICK_RATE_MS,
    HELYNA_TRANSFORMATION_DURATION_MS,
    HelynaForm,
    selectHelynaHealingTargets,
} from "./HelynaForms"
import {
    doFandralFlameSlashBoundsIntersect,
    expandFandralFlameSlashBounds,
    expandFandralFlameSlashBoundsForVisualSweep,
    FANDRAL_FLAME_SLASH_DURATION_MS,
    FANDRAL_FLAME_SLASH_IMPACT_PROGRESS,
    FandralFlameSlashBounds,
    FandralGridCell,
    getFandralFlameSlashCells,
    getFandralFlameSlashVisualSweepDistance,
} from "./FandralFlameSlash"

const humanRegrowthSource = "Regrowth"
const humanRejuvenationSource = "Rejuvenation"
const bearAbilitySource = "Regeneração Frenética"
const HELYNA_BEAR_CLEAVE_SIZE_MULTIPLIER = 0.75

export class Helyna extends Character {
    baseAttackSpeed = 1
    baseAttackDamage = 20
    baseMaxMana = 120
    baseAttackRange = 3
    baseMaxHealth: number = 400

    abilityName = "Druidism"

    private baseFormMaxHealth = 0
    private baseFormScale = 1
    private baseFormAD = 0
    private baseFormSpeed = 0
    private baseFormAttackSpeed = 0
    private baseFormCriticalChance = 0
    private baseFormAttackRange = 0
    private baseFormArmor = 0
    private rakeCooldownMs = 0

    druidForm: HelynaForm = "human"
    private transformationTimer?: Phaser.Time.TimerEvent
    private stopTransformationOnStateChange?: () => void

    constructor(scene: Game, id: string) {
        super(scene, "helyna", id)
        this.once("destroy", () => this.clearTransformationTimer())
    }

    override getAbilityDescription(): string {
        try {
            const placement = this.getPlacement()

            const bear = `[primary.main:Bear] (front): Helyna becomes a guardian beast for [primary.main:${HELYNA_TRANSFORMATION_DURATION_MS / 1000}s], blooms [success.main:Regrowth] and [success.main:Rejuvenation] on herself, gains [success.main:${Math.round(
                this.abilityPower * HELYNA_BEAR_MAX_HEALTH_AP_RATIO
            )}] [info.main:(${HELYNA_BEAR_MAX_HEALTH_AP_RATIO * 100}% AP)] maximum health and [error.main:${Math.round(
                this.abilityPower * HELYNA_BEAR_ATTACK_DAMAGE_AP_RATIO
            )}] [info.main:(${HELYNA_BEAR_ATTACK_DAMAGE_AP_RATIO * 100}% AP)] attack. Bear form uses [error.main:Rage]; when wounded, she spends rage on [success.main:Regeneração Frenética] to restore [info.main:${Math.round(
                calculateHelynaFrenziedRegenerationHealing(this.abilityPower, this.maxHealth)
            )} (${HELYNA_FRENZIED_REGENERATION_AP_RATIO * 100}% AP] + [success.main:${HELYNA_FRENZIED_REGENERATION_MAX_HEALTH_RATIO * 100}% maximum health)] health over time. Her attacks become a physical cleave.`

            const cat = `[primary.main:Cat] (middle): Helyna pounces into melee and hunts for [primary.main:${HELYNA_TRANSFORMATION_DURATION_MS / 1000}s], gaining speed, attack speed and [error.main:${Math.round(
                this.abilityPower * HELYNA_CAT_ATTACK_DAMAGE_AP_RATIO
            )}] [info.main:(${HELYNA_CAT_ATTACK_DAMAGE_AP_RATIO * 100}% AP)] attack. Cat form uses [warning.main:Energy] and spends it on [error.main:Rake], a savage bite that leaves the target bleeding for [error.main:${Math.round(
                calculateHelynaRakeTotalDamage(this.attackDamage)
            )} (${HELYNA_RAKE_ATTACK_DAMAGE_RATIO * 100}% AD)] physical damage over time.`

            const human = `[primary.main:Human] (back): Helyna remains a healer and casts twice, seeking the most wounded allies. Each bloom applies [success.main:Regrowth] for [info.main:${Math.round(
                calculateHelynaRegrowthHealing(this.abilityPower)
            )} (${HELYNA_HUMAN_REGROWTH_AP_RATIO * 100}% AP)] healing and [success.main:Rejuvenation] for [info.main:${Math.round(
                calculateHelynaRejuvenationHealing(this.abilityPower)
            )} (${HELYNA_HUMAN_REJUVENATION_AP_RATIO * 100}% AP)] healing over time.`

            return placement === "front"
                ? bear
                : placement === "middle"
                ? cat
                : placement === "back"
                ? human
                : `Helyna's role changes with her starting position.

${bear}

${cat}

${human}`
        } catch (error) {
            return ""
        }
    }

    override landAttack() {
        if (this.druidForm === "bear") {
            this.landBearCleave()
            return
        }

        if (this.druidForm === "human") {
            this.fire()
            return
        }

        super.landAttack()
    }

    fire() {
        if (!this.target || !this?.active) return

        const arrow = new Arrow(this.scene, this.x, this.y, this)
        arrow.setTint(0x00ff00)
        arrow.fire(this.target)
    }

    override castAbility(multiplier = 1): boolean {
        if (this.casting) return false

        this.casting = true
        const placement = this.getPlacement()

        if (placement === "back") {
            this.castHumanAbility(multiplier)
        } else if (placement === "front") {
            this.shapeshift("bear", multiplier)
        } else {
            this.shapeshift("cat", multiplier)
        }

        this.casting = false
        return true
    }

    private shapeshift(form: HelynaForm, multiplier: number) {
        if (form === "human") return

        this.clearTransformationTimer()
        this.druidForm = form
        new FxSprite(this.scene, this.x, this.y, "fog", this.scale / 2)

        if (form === "bear") {
            this.makeBear(multiplier)
        } else {
            this.makeCat()
        }

        this.manaLocked = true
        this.stopTransformationOnStateChange = () => this.returnToHuman()
        this.scene.events.once("gamestate", this.stopTransformationOnStateChange)
        this.transformationTimer = this.scene.time.delayedCall(HELYNA_TRANSFORMATION_DURATION_MS, () => this.returnToHuman())
    }

    private clearTransformationTimer() {
        this.transformationTimer?.remove(false)
        this.transformationTimer = undefined

        if (this.stopTransformationOnStateChange) {
            this.scene.events.off("gamestate", this.stopTransformationOnStateChange)
            this.stopTransformationOnStateChange = undefined
        }
    }

    private returnToHuman() {
        if (this.druidForm === "human") return

        const healthRate = this.maxHealth > 0 ? this.health / this.maxHealth : 1
        this.clearTransformationTimer()
        this.druidForm = "human"
        this.setTexture(this.name)
        this.setScale(this.baseFormScale)
        this.maxHealth = this.baseFormMaxHealth
        this.health = Math.min(this.maxHealth, this.maxHealth * healthRate)
        this.attackDamage = this.baseFormAD
        this.attackSpeed = this.baseFormAttackSpeed
        this.speed = this.baseFormSpeed
        this.critChance = this.baseFormCriticalChance
        this.attackRange = this.baseFormAttackRange
        this.armor = this.baseFormArmor
        this.rage = 0
        this.energy = this.maxEnergy
        this.mana = 0
        this.manaLocked = false
        this.setResourceType("mana")
        this.updateHealthUi()
    }

    private castHumanAbility(multiplier = 1) {
        const targets = selectHelynaHealingTargets(this.team.getChildren(true, true), 2)
        for (const target of targets) {
            this.castRegrowthAndRejuvenation(target, multiplier)
        }
    }

    private castRegrowthAndRejuvenation(target: Creature, multiplier = 1) {
        new Heal(target)
        const regrowthValue = calculateHelynaRegrowthHealing(this.abilityPower, multiplier)
        const rejuvenationValue = calculateHelynaRejuvenationHealing(this.abilityPower, multiplier)
        const regrowth = this.calculateDamage(regrowthValue)
        target.heal(regrowth.value, { healer: this, source: humanRegrowthSource })
        new Hot({
            abilityName: humanRejuvenationSource,
            duration: 3000,
            target,
            tickRate: 500,
            user: this,
            value: rejuvenationValue,
            valueType: "total",
        }).start()
    }

    private castFrenziedRegeneration(multiplier = 1) {
        if (this.druidForm !== "bear") return
        if (this.health / this.maxHealth > HELYNA_FRENZIED_REGENERATION_HEALTH_THRESHOLD) return
        if (!this.spendResource(HELYNA_FRENZIED_REGENERATION_RAGE_COST)) return

        new Hot({
            abilityName: bearAbilitySource,
            duration: HELYNA_FRENZIED_REGENERATION_DURATION_MS,
            target: this,
            tickRate: HELYNA_FRENZIED_REGENERATION_TICK_RATE_MS,
            user: this,
            value: calculateHelynaFrenziedRegenerationHealing(this.abilityPower, this.maxHealth, multiplier),
            valueType: "total",
        }).start()
    }

    private castRake(multiplier = 1) {
        if (this.druidForm !== "cat") return
        if (!this.target?.active || !this.isInAttackRange()) return
        if (this.rakeCooldownMs > 0) return
        if (!this.spendResource(HELYNA_RAKE_ENERGY_COST)) return

        this.drawRakeBite(this.target)
        this.rakeCooldownMs = HELYNA_RAKE_COOLDOWN_MS
        new Dot({
            damageType: "normal",
            duration: HELYNA_RAKE_DURATION_MS,
            target: this.target,
            tickDamage: calculateHelynaRakeTickDamage(this.attackDamage, multiplier),
            tickRate: HELYNA_RAKE_TICK_RATE_MS,
            user: this,
            abilityName: "Rake",
        }).start()
    }

    private drawRakeBite(target: Creature) {
        const graphic = this.scene.add.graphics().setDepth(target.depth + 10).setBlendMode(Phaser.BlendModes.ADD)
        this.scene.perRoundFx.add(graphic)
        graphic.lineStyle(5, 0xffffff, 0.85)
        graphic.strokeCircle(target.x - 7, target.y - 9, 9)
        graphic.strokeCircle(target.x + 7, target.y - 9, 9)
        graphic.lineStyle(3, 0x8b0000, 0.8)
        graphic.lineBetween(target.x - 14, target.y + 2, target.x - 3, target.y + 10)
        graphic.lineBetween(target.x + 14, target.y + 2, target.x + 3, target.y + 10)
        this.scene.tweens.add({
            targets: graphic,
            alpha: 0,
            scale: 1.4,
            duration: 220,
            ease: "Sine.easeOut",
            onComplete: () => graphic.destroy(true),
        })
    }

    private makeBear(multiplier: number) {
        this.setTexture("druid_bear")
        this.attackRange = 1
        const healthRate = this.maxHealth > 0 ? this.health / this.maxHealth : 1
        this.maxHealth = calculateHelynaBearMaxHealth(this.baseFormMaxHealth, this.abilityPower)
        this.health = this.maxHealth * healthRate
        this.setScale(this.baseFormScale * 1.5)
        this.attackDamage = calculateHelynaBearAttackDamage(this.baseFormAD, this.abilityPower)
        this.armor = this.baseFormArmor + 10
        this.maxRage = HELYNA_RAGE_MAX
        this.rage = 0
        this.setResourceType("rage")
        this.updateHealthUi()
        this.castRegrowthAndRejuvenation(this, multiplier)
    }

    private makeCat() {
        this.setTexture("druid_cat")
        this.attackRange = 1
        this.attackDamage = calculateHelynaCatAttackDamage(this.baseFormAD, this.abilityPower)
        this.attackSpeed = this.baseFormAttackSpeed * HELYNA_CAT_ATTACK_SPEED_MULTIPLIER
        this.speed = this.baseFormSpeed * HELYNA_CAT_SPEED_MULTIPLIER
        this.critChance = this.baseFormCriticalChance + this.abilityPower * HELYNA_CAT_CRIT_CHANCE_AP_RATIO
        this.maxEnergy = HELYNA_ENERGY_MAX
        this.energy = this.maxEnergy
        this.energyPerSecond = HELYNA_ENERGY_REGEN_PER_SECOND
        this.rakeCooldownMs = 0
        this.setResourceType("energy")

        const target = this.getValidTarget()
        if (target) {
            this.target = target
            this.pounceToTarget(target)
        }
    }

    private getValidTarget(): Creature | undefined {
        if (this.target?.active && this.target.canBeTargeted) return this.target
        return this.getClosestEnemy()
    }

    private landBearCleave() {
        const target = this.getValidTarget()
        if (!target) return

        this.target = target
        this.updateFacingDirection()
        const targetCell = this.scene.grid.worldToCell(target.x, target.y)
        if (!targetCell) return

        const cells = getFandralFlameSlashCells(targetCell, this.facing, this.scene.grid.cols, this.scene.grid.rows)
        if (cells.length === 0) return

        const bounds = this.scaleCleaveBounds(this.getCleaveBounds(cells), HELYNA_BEAR_CLEAVE_SIZE_MULTIPLIER)
        const hitBounds = expandFandralFlameSlashBoundsForVisualSweep(bounds, this.facing, this.scene.grid.cellW, this.scene.grid.cellH)
        this.drawBearCleave(cells, bounds, this.facing, () => this.hitBearCleave(hitBounds))
    }

    private scaleCleaveBounds(bounds: FandralFlameSlashBounds, multiplier: number): FandralFlameSlashBounds {
        const centerX = (bounds.minX + bounds.maxX) / 2
        const centerY = (bounds.minY + bounds.maxY) / 2
        const halfWidth = ((bounds.maxX - bounds.minX) * multiplier) / 2
        const halfHeight = ((bounds.maxY - bounds.minY) * multiplier) / 2

        return {
            minX: centerX - halfWidth,
            maxX: centerX + halfWidth,
            minY: centerY - halfHeight,
            maxY: centerY + halfHeight,
        }
    }

    private hitBearCleave(bounds: FandralFlameSlashBounds) {
        const targets = this.getEnemyTeam()
            .getChildren(true, true)
            .filter((enemy) => enemy.active && enemy.canBeTargeted && doFandralFlameSlashBoundsIntersect(bounds, this.getCreatureHitBounds(enemy)))

        for (const target of targets) {
            const { value, crit } = this.calculateDamage(this.attackDamage)
            target.takeDamage(value, this, "normal", crit, true, "Bear Cleave")
            this.onHit(target)
        }
    }

    private getCreatureHitBounds(creature: Creature): FandralFlameSlashBounds {
        if (creature.body) {
            return {
                minX: creature.body.x,
                maxX: creature.body.x + creature.body.width,
                minY: creature.body.y,
                maxY: creature.body.y + creature.body.height,
            }
        }

        const bounds = creature.getBounds()
        return {
            minX: bounds.left,
            maxX: bounds.right,
            minY: bounds.top,
            maxY: bounds.bottom,
        }
    }

    private getCleaveBounds(cells: FandralGridCell[]): FandralFlameSlashBounds {
        const centers = cells.map((cell) => this.scene.grid.cellToCenter(cell.col, cell.row))

        return expandFandralFlameSlashBounds({
            minX: Math.min(...centers.map((center) => center.x)) - this.scene.grid.cellW / 2,
            maxX: Math.max(...centers.map((center) => center.x)) + this.scene.grid.cellW / 2,
            minY: Math.min(...centers.map((center) => center.y)) - this.scene.grid.cellH / 2,
            maxY: Math.max(...centers.map((center) => center.y)) + this.scene.grid.cellH / 2,
        })
    }

    private drawBearCleave(cells: FandralGridCell[], bounds: FandralFlameSlashBounds, facing: Direction, onImpact: () => void) {
        if (cells.length === 0) {
            onImpact()
            return
        }

        const graphic = this.scene.add.graphics().setDepth(this.depth + 8).setBlendMode(Phaser.BlendModes.ADD)
        this.scene.perRoundFx.add(graphic)

        let cleaned = false
        let impacted = false
        let tween: Phaser.Tweens.Tween | undefined

        const cleanup = (destroyGraphic = true) => {
            if (cleaned) return
            cleaned = true

            this.scene.events.off("gamestate", stopSlash)
            this.off("died", stopSlash)
            this.off("destroy", stopSlash)

            if (tween) {
                tween.stop()
                this.scene.tweens.remove(tween)
                tween = undefined
            }

            if (destroyGraphic && graphic.active) {
                graphic.destroy(true)
            }
        }

        const stopSlash = () => cleanup()
        graphic.once("destroy", () => cleanup(false))
        this.once("died", stopSlash)
        this.once("destroy", stopSlash)

        tween = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: FANDRAL_FLAME_SLASH_DURATION_MS,
            ease: "Sine.easeInOut",
            onUpdate: (activeTween: Phaser.Tweens.Tween) => {
                const progress = activeTween.getValue() as number
                this.redrawBearCleave(graphic, bounds, facing, progress)

                if (!impacted && progress >= FANDRAL_FLAME_SLASH_IMPACT_PROGRESS) {
                    impacted = true
                    onImpact()
                }
            },
            onComplete: () => {
                if (!impacted) onImpact()
                cleanup()
            },
            onStop: () => cleanup(),
        })

        this.scene.events.once("gamestate", stopSlash)
    }

    private redrawBearCleave(graphic: Phaser.GameObjects.Graphics, bounds: FandralFlameSlashBounds, facing: Direction, progress: number) {
        graphic.clear()

        if (facing === "up" || facing === "down") {
            const sign = facing === "up" ? 1 : -1
            const sweepDistance = getFandralFlameSlashVisualSweepDistance(facing, this.scene.grid.cellW, this.scene.grid.cellH)
            const sweep = Phaser.Math.Linear(-sweepDistance, sweepDistance, progress) * sign
            const centerY = (bounds.minY + bounds.maxY) / 2
            this.drawHorizontalClaws(graphic, bounds.minX + sweep, bounds.maxX + sweep, centerY, facing === "up" ? -1 : 1)
            return
        }

        const sign = facing === "right" ? 1 : -1
        const sweepDistance = getFandralFlameSlashVisualSweepDistance(facing, this.scene.grid.cellW, this.scene.grid.cellH)
        const sweep = Phaser.Math.Linear(-sweepDistance, sweepDistance, progress) * sign
        const centerX = (bounds.minX + bounds.maxX) / 2
        this.drawVerticalClaws(graphic, centerX, bounds.minY + sweep, bounds.maxY + sweep, facing === "right" ? 1 : -1)
    }

    private drawHorizontalClaws(graphic: Phaser.GameObjects.Graphics, minX: number, maxX: number, centerY: number, curveDirection: number) {
        for (const offset of [-14, 0, 14]) {
            const y = centerY + offset
            this.drawClawCurve(graphic, minX + 16, y, (minX + maxX) / 2, y + 14 * curveDirection, maxX - 16, y)
        }
    }

    private drawVerticalClaws(graphic: Phaser.GameObjects.Graphics, centerX: number, minY: number, maxY: number, curveDirection: number) {
        for (const offset of [-14, 0, 14]) {
            const x = centerX + offset
            this.drawClawCurve(graphic, x, minY + 16, x + 14 * curveDirection, (minY + maxY) / 2, x, maxY - 16)
        }
    }

    private drawClawCurve(graphic: Phaser.GameObjects.Graphics, startX: number, startY: number, controlX: number, controlY: number, endX: number, endY: number) {
        graphic.lineStyle(12, 0x222222, 0.18)
        this.strokeQuadratic(graphic, startX, startY, controlX, controlY, endX, endY)
        graphic.lineStyle(6, 0xbfc3c7, 0.82)
        this.strokeQuadratic(graphic, startX, startY, controlX, controlY, endX, endY)
        graphic.lineStyle(2, 0xffffff, 0.96)
        this.strokeQuadratic(graphic, startX, startY, controlX, controlY, endX, endY)
    }

    private strokeQuadratic(
        graphic: Phaser.GameObjects.Graphics,
        startX: number,
        startY: number,
        controlX: number,
        controlY: number,
        endX: number,
        endY: number
    ) {
        let previousX = startX
        let previousY = startY

        for (let step = 1; step <= 12; step++) {
            const t = step / 12
            const inverse = 1 - t
            const x = inverse * inverse * startX + 2 * inverse * t * controlX + t * t * endX
            const y = inverse * inverse * startY + 2 * inverse * t * controlY + t * t * endY
            graphic.lineBetween(previousX, previousY, x, y)
            previousX = x
            previousY = y
        }
    }

    override extractAnimationsFromSpritesheet(
        key: string,
        startingFrame: number,
        usedFramesPerRow: number,
        totalFramesPerRow?: number,
        texture?: string
    ): Phaser.Animations.Animation[] {
        super.extractAnimationsFromSpritesheet(key, startingFrame, usedFramesPerRow, totalFramesPerRow, "druid_bear", "druid_bear")
        super.extractAnimationsFromSpritesheet(key, startingFrame, usedFramesPerRow, totalFramesPerRow, "druid_cat", "druid_cat")
        return super.extractAnimationsFromSpritesheet(key, startingFrame, usedFramesPerRow, totalFramesPerRow, texture)
    }

    override getAnimationTextureName(): string {
        return this.druidForm === "human" ? this.name : `druid_${this.druidForm}`
    }

    override refreshStats(): void {
        this.clearTransformationTimer()
        super.refreshStats()
        this.setTexture(this.name)
        this.druidForm = "human"
        this.baseFormSpeed = this.speed
        this.baseFormMaxHealth = this.maxHealth
        this.baseFormAD = this.attackDamage
        this.baseFormAttackSpeed = this.attackSpeed
        this.baseFormCriticalChance = this.critChance
        this.baseFormScale = this.scale
        this.baseFormAttackRange = this.attackRange
        this.baseFormArmor = this.armor
        this.maxRage = HELYNA_RAGE_MAX
        this.rage = 0
        this.maxEnergy = HELYNA_ENERGY_MAX
        this.energy = this.maxEnergy
        this.energyPerSecond = HELYNA_ENERGY_REGEN_PER_SECOND
        this.rakeCooldownMs = 0
        this.setResourceType("mana")
        this.gainMana(this.maxMana * 0.35)
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)

        if (this.scene.state === "idle" || !this.active) return

        if (this.rakeCooldownMs > 0) {
            this.rakeCooldownMs = Math.max(0, this.rakeCooldownMs - delta)
        }

        if (this.druidForm === "bear") {
            this.castFrenziedRegeneration()
        } else if (this.druidForm === "cat") {
            this.castRake()
        }
    }

}
