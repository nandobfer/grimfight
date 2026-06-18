import { Dot } from "../../objects/StatusEffect/Dot"
import { Game } from "../../scenes/Game"
import type { LightParams } from "../../fx/FxSprite"
import type { Direction } from "../Creature"
import { Character } from "../character/Character"
import { Creature } from "../Creature"
import {
    calculateFandralFlameSlashBurnTickDamage,
    calculateFandralFlameSlashBurnTotalDamage,
    calculateFandralFlameSlashDirectDamage,
    FANDRAL_FLAME_SLASH_BURN_DURATION_MS,
    FANDRAL_FLAME_SLASH_BURN_SOURCE,
    FANDRAL_FLAME_SLASH_BURN_TICK_RATE_MS,
    FANDRAL_FLAME_SLASH_DURATION_MS,
    FANDRAL_FLAME_SLASH_IMPACT_PROGRESS,
    FandralFlameSlashBounds,
    FandralGridCell,
    doFandralFlameSlashBoundsIntersect,
    expandFandralFlameSlashBounds,
    expandFandralFlameSlashBoundsForVisualSweep,
    getFandralFlameSlashCells,
    getFandralFlameSlashVisualSweepDistance,
} from "./FandralFlameSlash"

export class Fandral extends Character {
    baseAttackSpeed = 1.15
    baseSpeed = 150
    baseAttackDamage = 22
    baseCritChance = 20
    baseAttackRange = 1
		baseMaxHealth: number = 350

    abilityName = "Flame Slash"

    private light?: Phaser.GameObjects.Light
    private lightTween?: Phaser.Tweens.Tween

    constructor(scene: Game, id: string) {
        super(scene, "fandral", id)

        this.addLightEffect({
            color: 0xff7a18,
            intensity: 0.32,
            minIntensity: 0.24,
            maxIntensity: 0.42,
            radius: 56,
            minRadius: 48,
            maxRadius: 68,
            duration: 1200,
        })
    }

    private addLightEffect(lightParams: LightParams) {
        if (!this.scene.lights) return

        this.light = this.scene.lights.addLight(this.x, this.y, lightParams.radius, lightParams.color, lightParams.intensity)

        this.lightTween = this.scene.tweens.add({
            targets: this.light,
            radius: { from: lightParams.minRadius ?? lightParams.radius, to: lightParams.maxRadius ?? lightParams.radius },
            intensity: { from: lightParams.minIntensity ?? lightParams.intensity, to: lightParams.maxIntensity ?? lightParams.intensity },
            duration: lightParams.duration ?? 1000,
            yoyo: lightParams.yoyo ?? true,
            repeat: lightParams.repeat ?? -1,
            ease: "Sine.easeInOut",
        })

        const handleUpdate = () => {
            if (this.active && this.light) {
                this.light.setPosition(this.x, this.y)
            }
        }

        this.scene.events.on("update", handleUpdate)
        this.once("destroy", () => {
            this.scene.events.off("update", handleUpdate)

            if (this.lightTween) {
                this.lightTween.stop()
                this.scene.tweens.remove(this.lightTween)
                this.lightTween = undefined
            }

            if (this.light) {
                this.scene.lights?.removeLight(this.light)
                this.light = undefined
            }
        })
    }

    override getAbilityDescription(): string {
        return `Slashes the grid around the target, dealing [error.main:${Math.round(
            calculateFandralFlameSlashDirectDamage(this.abilityPower)
        )} (75% AP)] fire damage and burning enemies hit for [error.main:${Math.round(
            calculateFandralFlameSlashBurnTotalDamage(this.abilityPower)
        )} (75% AP)] fire damage over 5 seconds.`
    }

    override castAbility(multiplier = 1): void {
        this.casting = true

        const target = this.getValidFlameSlashTarget()
        if (!target) {
            this.refundFlameSlashCast()
            return
        }

        this.target = target
        if (this.isInAttackRange()) {
            this.executeFlameSlash(target, multiplier)
            return
        }

        this.jumpToFlameSlashTarget(target, multiplier)
    }

    private executeFlameSlash(target: Creature, multiplier: number): void {
        if (!target.active || !target.canBeTargeted) {
            const nextTarget = this.getValidFlameSlashTarget()
            if (!nextTarget) {
                this.refundFlameSlashCast()
                return
            }

            this.target = nextTarget
            target = nextTarget
        }

        this.updateFacingDirection()

        const targetCell = this.scene.grid.worldToCell(target.x, target.y)
        if (!targetCell) {
            this.refundFlameSlashCast()
            return
        }

        const cells = getFandralFlameSlashCells(targetCell, this.facing, this.scene.grid.cols, this.scene.grid.rows)
        const bounds = this.getFlameSlashBounds(cells)
        const hitBounds = expandFandralFlameSlashBoundsForVisualSweep(bounds, this.facing, this.scene.grid.cellW, this.scene.grid.cellH)
        this.drawFlameSlash(cells, bounds, this.facing, () => this.hitFlameSlashBounds(hitBounds, multiplier))
    }

    private getValidFlameSlashTarget(): Creature | undefined {
        if (this.target?.active && this.target.canBeTargeted) return this.target
        return this.getClosestEnemy()
    }

    private refundFlameSlashCast() {
        this.gainMana(this.maxMana)
        this.casting = false
    }

    private jumpToFlameSlashTarget(target: Creature, multiplier: number) {
        const position = target.randomPointAround()
        const duration = this.getFlameSlashJumpDuration(position)
        let cleaned = false
        let tween: Phaser.Tweens.Tween | undefined

        const cleanup = (releaseCast = true) => {
            if (cleaned) return
            cleaned = true

            this.scene.events.off("gamestate", stopJump)
            this.off("died", stopJump)
            this.off("destroy", stopJump)

            if (tween) {
                tween.stop()
                this.scene.tweens.remove(tween)
                tween = undefined
            }

            if (releaseCast) {
                this.casting = false
            }
        }

        const stopJump = () => cleanup()

        this.scene.events.once("gamestate", stopJump)
        this.once("died", stopJump)
        this.once("destroy", stopJump)

        tween = this.scene.tweens.add({
            targets: this,
            x: position.x,
            y: position.y,
            duration,
            ease: "Expo.easeOut",
            onComplete: () => {
                cleanup(false)
                this.body?.reset(position.x, position.y)
                this.emit("move", this, position.x, position.y)

                const nextTarget = this.getValidFlameSlashTarget()
                if (!nextTarget) {
                    this.refundFlameSlashCast()
                    return
                }

                this.target = nextTarget
                this.executeFlameSlash(nextTarget, multiplier)
            },
            onStop: () => cleanup(),
        })
    }

    private getFlameSlashJumpDuration(to: { x: number; y: number }) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, to.x, to.y)
        const pxPerSecond = 1500
        return Phaser.Math.Clamp((distance / pxPerSecond) * 1000, 90, 220)
    }

    private hitFlameSlashBounds(bounds: FandralFlameSlashBounds, multiplier: number) {
        const targets = this.getTargetsInFlameSlashBounds(bounds)
        for (const target of targets) {
            const directDamage = this.calculateDamage(calculateFandralFlameSlashDirectDamage(this.abilityPower, multiplier))
            target.takeDamage(directDamage.value, this, "fire", directDamage.crit, true, this.abilityName)

            new Dot({
                abilityName: FANDRAL_FLAME_SLASH_BURN_SOURCE,
                damageType: "fire",
                duration: FANDRAL_FLAME_SLASH_BURN_DURATION_MS,
                target,
                tickDamage: calculateFandralFlameSlashBurnTickDamage(this.abilityPower, multiplier),
                tickRate: FANDRAL_FLAME_SLASH_BURN_TICK_RATE_MS,
                user: this,
            }).start()
        }
    }

    private getTargetsInFlameSlashBounds(bounds: FandralFlameSlashBounds): Creature[] {
        return this.getEnemyTeam()
            .getChildren(true, true)
            .filter((enemy) => {
                if (!enemy.active || !enemy.canBeTargeted) return false
                return doFandralFlameSlashBoundsIntersect(bounds, this.getCreatureHitBounds(enemy))
            })
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

    private drawFlameSlash(cells: FandralGridCell[], bounds: FandralFlameSlashBounds, facing: Direction, onImpact: () => void) {
        if (cells.length === 0) {
            onImpact()
            this.casting = false
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

            this.casting = false
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
                this.redrawFlameSlash(graphic, bounds, facing, progress)

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

    private getFlameSlashBounds(cells: FandralGridCell[]): FandralFlameSlashBounds {
        const centers = cells.map((cell) => this.scene.grid.cellToCenter(cell.col, cell.row))

        return expandFandralFlameSlashBounds({
            minX: Math.min(...centers.map((center) => center.x)) - this.scene.grid.cellW / 2,
            maxX: Math.max(...centers.map((center) => center.x)) + this.scene.grid.cellW / 2,
            minY: Math.min(...centers.map((center) => center.y)) - this.scene.grid.cellH / 2,
            maxY: Math.max(...centers.map((center) => center.y)) + this.scene.grid.cellH / 2,
        })
    }

    private redrawFlameSlash(graphic: Phaser.GameObjects.Graphics, bounds: FandralFlameSlashBounds, facing: Direction, progress: number) {
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
        graphic.lineStyle(12, 0xb91c1c, 0.22)
        this.strokeQuadratic(graphic, startX, startY, controlX, controlY, endX, endY)
        graphic.lineStyle(6, 0xf97316, 0.82)
        this.strokeQuadratic(graphic, startX, startY, controlX, controlY, endX, endY)
        graphic.lineStyle(2, 0xfff7ad, 0.96)
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
}
