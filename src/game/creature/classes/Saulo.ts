import { Dot } from "../../objects/StatusEffect/Dot"
import { Hot } from "../../objects/StatusEffect/Hot"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { Creature } from "../Creature"
import {
    calculateSauloOverdriveHealing,
    calculateSauloPoisonGasTickDamage,
    calculateSauloSpeedBoost,
    chooseSauloInitialPatrolEndpoint,
    getSauloSingleTargetPatrolEndpoints,
    getSauloTargetCellCrossingEndpoints,
    SAULO_GAS_CLOUD_DURATION_MS,
    SAULO_GAS_DOT_DURATION_MS,
    SAULO_GAS_DOT_TICK_RATE_MS,
    SAULO_GAS_EMIT_DISTANCE,
    SAULO_GAS_EMIT_INTERVAL_MS,
    SAULO_GAS_RADIUS,
    SAULO_OVERDRIVE_DURATION_MS,
} from "./SauloPoisonGas"
import type { SauloPoint } from "./SauloPoisonGas"

interface GasCloud {
    x: number
    y: number
    age: number
    seed: number
    graphic: Phaser.GameObjects.Graphics
}

type RoundFxObject = Phaser.GameObjects.GameObject & { scene?: Phaser.Scene }

const sauloGasDark = 0x14532d
const sauloGasGreen = 0x22c55e
const sauloGasBright = 0xbaff70

export class Saulo extends Character {
    baseAttackSpeed = 0.5
    baseAttackDamage = 0
    baseAttackRange = 1
    baseMaxHealth = 460
    baseArmor = 10
    baseSpeed = 110
    baseMaxMana = 80
    baseManaPerSecond = 12.5
    baseManaPerAttack = 0

    abilityName = "Toxic Overdrive"

    private readonly gasClouds: GasCloud[] = []
    private gasEmitElapsed = 0
    private gasDamageElapsed = 0
    private lastGasPosition?: SauloPoint
    private singleTargetPatrolEndpointIndex?: 0 | 1
    private singleTargetPatrolTarget?: Creature
    private singleTargetPatrolCell?: { col: number; row: number }
    private singleTargetPatrolEndpoints?: [SauloPoint, SauloPoint]
    private crossingTarget?: Creature
    private crossingDestination?: SauloPoint
    private speedBoostBonus = 0
    private speedBoostTimer?: Phaser.Time.TimerEvent
    private overdriveHot?: Hot

    constructor(scene: Game, id: string) {
        super(scene, "saulo", id)
    }

    override getAbilityDescription(): string {
        const tickDamage = calculateSauloPoisonGasTickDamage(this.abilityPower)
        const healing = calculateSauloOverdriveHealing(this.maxHealth)
        const speedBoost = calculateSauloSpeedBoost(this.speed)

        return `Saulo não ataca. Ele atravessa o combate perseguindo sempre o inimigo mais distante e deixa para trás nuvens de gás venenoso que duram brevemente, aplicando veneno em inimigos dentro da área por [info.main:${Math.round(
            tickDamage
        )} (11% AP)] de dano por tick.

Ao conjurar [primary.main:${this.abilityName}], Saulo cura a si mesmo em [success.main:${Math.round(
            healing
        )} (22% vida máxima)] ao longo de 5 segundos, ganha [primary.main:${Math.round(speedBoost)} de velocidade] temporária e provoca o alvo atual.`
    }

    override newTarget(): void {
        this.stopMoving()
        this.idle()
        this.clearCrossing()
        this.target = this.getFartestEnemy()
        this.resetPatrolIfTargetChanged()
        this.updateFacingDirection()
    }

    override startAttack(): void {}

    override landAttack(): void {}

    override avoidOtherCharacters(): void {}

    override castAbility(): boolean | void {
        this.applyOverdriveHot()
        this.applySpeedBoost()

        if (this.target?.active && this.target.canBeTargeted) {
            this.taunt(this.target)
        }
    }

    override refreshStats(): void {
        this.cleanupSauloState()
        super.refreshStats()
    }

    override withTargetUpdate(): void {
        if (!this.target?.active || !this.target.canBeTargeted) {
            this.newTarget()
            return
        }

        const validEnemies = this.getValidEnemies()
        if (validEnemies.length === 0) {
            this.target = undefined
            this.stopMoving()
            this.idle()
            return
        }

        if (validEnemies.length === 1) {
            this.clearCrossing()
            this.target = validEnemies[0]
            this.moveThroughSingleTarget(validEnemies[0])
            return
        }

        this.clearSingleTargetPatrol()

        if (this.moveToCrossingDestination()) {
            return
        }

        if (this.isInAttackRange()) {
            this.startCrossingTarget(this.target)
            return
        }

        if (!this.moveLocked && !this.frozen) {
            this.moveToTarget()
            this.emit("move", this)
        }
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)

        if (this.scene.state !== "fighting" || !this.active || this.health <= 0) {
            this.cleanupGasClouds()
            this.lastGasPosition = undefined
            return
        }

        this.updatePoisonGas(time, delta)
    }

    override destroy(fromScene?: boolean): void {
        this.cleanupSauloState()
        super.destroy(fromScene)
    }

    private getValidEnemies(): Creature[] {
        return this.getEnemyTeam()
            .getChildren(true, true)
            .filter((enemy) => enemy.active && enemy.canBeTargeted) as Creature[]
    }

    private getFarthestEnemyExcept(excluded: Creature): Creature | undefined {
        let chosen: Creature | undefined
        let chosenDistance = Number.NEGATIVE_INFINITY

        for (const enemy of this.getValidEnemies()) {
            if (enemy === excluded) continue

            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
            if (!chosen || distance > chosenDistance) {
                chosen = enemy
                chosenDistance = distance
            }
        }

        return chosen
    }

    private moveThroughSingleTarget(target: Creature): void {
        if (this.moveLocked || this.frozen) return

        const targetCell = this.scene.grid.worldToCell(target.x, target.y)
        if (!targetCell) {
            this.moveToTarget()
            this.emit("move", this)
            return
        }

        if (this.shouldResetSingleTargetPatrol(target, targetCell)) {
            this.singleTargetPatrolTarget = target
            this.singleTargetPatrolCell = { col: targetCell.col, row: targetCell.row }
            this.singleTargetPatrolEndpoints = getSauloSingleTargetPatrolEndpoints(this.getGridMetrics(), targetCell, { x: this.x, y: this.y })
            this.singleTargetPatrolEndpointIndex = chooseSauloInitialPatrolEndpoint({ x: this.x, y: this.y }, this.singleTargetPatrolEndpoints)
        }

        if (!this.singleTargetPatrolEndpoints || this.singleTargetPatrolEndpointIndex === undefined) return

        const destination = this.singleTargetPatrolEndpoints[this.singleTargetPatrolEndpointIndex]
        if (Phaser.Math.Distance.Between(this.x, this.y, destination.x, destination.y) <= this.calculateSingleTargetPatrolArrivalDistance()) {
            this.singleTargetPatrolEndpointIndex = this.singleTargetPatrolEndpointIndex === 0 ? 1 : 0
        }

        this.moveToPoint(this.singleTargetPatrolEndpoints[this.singleTargetPatrolEndpointIndex])
        this.emit("move", this)
    }

    private shouldResetSingleTargetPatrol(target: Creature, targetCell: { col: number; row: number }): boolean {
        return (
            this.singleTargetPatrolTarget !== target ||
            !this.singleTargetPatrolCell ||
            this.singleTargetPatrolCell.col !== targetCell.col ||
            this.singleTargetPatrolCell.row !== targetCell.row ||
            !this.singleTargetPatrolEndpoints ||
            this.singleTargetPatrolEndpointIndex === undefined
        )
    }

    private clearSingleTargetPatrol(): void {
        this.singleTargetPatrolEndpointIndex = undefined
        this.singleTargetPatrolTarget = undefined
        this.singleTargetPatrolCell = undefined
        this.singleTargetPatrolEndpoints = undefined
    }

    private calculateSingleTargetPatrolArrivalDistance(): number {
        return Math.max(4, Math.min(this.scene.grid.cellW, this.scene.grid.cellH) * 0.08)
    }

    private startCrossingTarget(target: Creature): void {
        const targetCell = this.scene.grid.worldToCell(target.x, target.y)
        if (!targetCell) {
            this.target = this.getFarthestEnemyExcept(target) ?? this.getFartestEnemy()
            this.updateFacingDirection()
            return
        }

        const [, destination] = getSauloTargetCellCrossingEndpoints(this.getGridMetrics(), targetCell, { x: this.x, y: this.y })
        this.crossingTarget = target
        this.crossingDestination = destination
        this.moveToCrossingDestination()
    }

    private moveToCrossingDestination(): boolean {
        if (!this.crossingTarget || !this.crossingDestination) return false

        if (!this.crossingTarget.active || !this.crossingTarget.canBeTargeted) {
            this.clearCrossing()
            this.newTarget()
            return true
        }

        if (this.moveLocked || this.frozen) return true

        if (Phaser.Math.Distance.Between(this.x, this.y, this.crossingDestination.x, this.crossingDestination.y) <= this.calculateCrossingArrivalDistance()) {
            const crossedTarget = this.crossingTarget
            this.clearCrossing()
            this.target = this.getFarthestEnemyExcept(crossedTarget) ?? this.getFartestEnemy()
            this.updateFacingDirection()
            return true
        }

        this.moveToPoint(this.crossingDestination)
        this.emit("move", this)
        return true
    }

    private clearCrossing(): void {
        this.crossingTarget = undefined
        this.crossingDestination = undefined
    }

    private calculateCrossingArrivalDistance(): number {
        return Math.max(8, Math.min(this.scene.grid.cellW, this.scene.grid.cellH) * 0.18)
    }

    private getGridMetrics() {
        const firstCellCenter = this.scene.grid.cellToCenter(0, 0)
        return {
            left: firstCellCenter.x - this.scene.grid.cellW / 2,
            top: firstCellCenter.y - this.scene.grid.cellH / 2,
            cellW: this.scene.grid.cellW,
            cellH: this.scene.grid.cellH,
            cols: this.scene.grid.cols,
            rows: this.scene.grid.rows,
        }
    }

    private moveToPoint(point: SauloPoint): void {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, point.x, point.y)
        this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), this.speed, this.body.velocity)
        this.updateFacingToward(point.x, point.y)
        this.play(`${this.getAnimationTextureName()}-walking-${this.facing}`, true)
    }

    private updateFacingToward(x: number, y: number): void {
        const degrees = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(this.x, this.y, x, y))

        if (degrees >= -45 && degrees < 45) {
            this.facing = "right"
        } else if (degrees >= 45 && degrees < 135) {
            this.facing = "down"
        } else if (degrees >= 135 || degrees < -135) {
            this.facing = "left"
        } else {
            this.facing = "up"
        }
    }

    private resetPatrolIfTargetChanged(): void {
        if (this.singleTargetPatrolTarget === this.target) return

        this.clearSingleTargetPatrol()
    }

    private applyOverdriveHot(): void {
        if (this.overdriveHot && this.statusEffects.has(this.overdriveHot)) {
            this.overdriveHot.resetDuration()
            return
        }

        this.overdriveHot = new Hot({
            abilityName: this.abilityName,
            duration: SAULO_OVERDRIVE_DURATION_MS,
            target: this,
            tickRate: 1000,
            user: this,
            value: calculateSauloOverdriveHealing(this.maxHealth),
            valueType: "total",
        })
        this.overdriveHot.start()
    }

    private applySpeedBoost(): void {
        this.cleanupSpeedBoost()

        this.speedBoostBonus = calculateSauloSpeedBoost(this.speed)
        this.speed += this.speedBoostBonus
        this.speedBoostTimer = this.scene.time.delayedCall(SAULO_OVERDRIVE_DURATION_MS, () => this.cleanupSpeedBoost())
    }

    private cleanupSpeedBoost(): void {
        if (this.speedBoostTimer) {
            this.speedBoostTimer.remove(false)
            this.speedBoostTimer = undefined
        }

        if (this.speedBoostBonus > 0) {
            this.speed = Math.max(0, this.speed - this.speedBoostBonus)
            this.speedBoostBonus = 0
        }
    }

    private updatePoisonGas(time: number, delta: number): void {
        this.gasEmitElapsed += delta
        this.gasDamageElapsed += delta
        this.tryEmitGasCloud()
        this.updateGasClouds(time, delta)
        this.applyGasDamage()
    }

    private tryEmitGasCloud(): void {
        if (this.gasEmitElapsed < SAULO_GAS_EMIT_INTERVAL_MS) return

        const movedEnough =
            !this.lastGasPosition || Phaser.Math.Distance.Between(this.x, this.y, this.lastGasPosition.x, this.lastGasPosition.y) >= SAULO_GAS_EMIT_DISTANCE
        if (!movedEnough && this.gasClouds.length > 0) return

        this.gasEmitElapsed = 0
        this.lastGasPosition = { x: this.x, y: this.y }
        this.createGasCloud(this.x, this.y)
    }

    private createGasCloud(x: number, y: number): void {
        const graphic = this.scene.add.graphics().setDepth(this.depth - 1).setBlendMode(Phaser.BlendModes.ADD)
        this.trackRoundFx(graphic)
        this.gasClouds.push({ x, y, age: 0, seed: Phaser.Math.FloatBetween(0, Math.PI * 2), graphic })
    }

    private updateGasClouds(time: number, delta: number): void {
        for (let index = this.gasClouds.length - 1; index >= 0; index--) {
            const cloud = this.gasClouds[index]
            cloud.age += delta

            if (cloud.age >= SAULO_GAS_CLOUD_DURATION_MS || !cloud.graphic.active) {
                this.destroyRoundFx(cloud.graphic)
                this.gasClouds.splice(index, 1)
                continue
            }

            this.drawGasCloud(cloud, time)
        }
    }

    private drawGasCloud(cloud: GasCloud, time: number): void {
        const progress = Phaser.Math.Clamp(cloud.age / SAULO_GAS_CLOUD_DURATION_MS, 0, 1)
        const alpha = (1 - progress) * 0.32
        const pulse = (Math.sin(time * 0.008 + cloud.seed) + 1) * 0.5

        cloud.graphic.clear()
        cloud.graphic.fillStyle(sauloGasDark, alpha * 0.55)
        cloud.graphic.fillEllipse(cloud.x, cloud.y + 6, SAULO_GAS_RADIUS * 1.5, SAULO_GAS_RADIUS * 0.56)
        cloud.graphic.fillStyle(sauloGasGreen, alpha)
        cloud.graphic.fillCircle(cloud.x - 8 + pulse * 4, cloud.y - 4, 16 + progress * 8)
        cloud.graphic.fillCircle(cloud.x + 9 - pulse * 5, cloud.y, 14 + progress * 7)
        cloud.graphic.fillStyle(sauloGasBright, alpha * 0.62)
        cloud.graphic.fillCircle(cloud.x + Math.sin(time * 0.011 + cloud.seed) * 10, cloud.y - 10, 4 + pulse * 3)
    }

    private applyGasDamage(): void {
        if (this.gasDamageElapsed < SAULO_GAS_DOT_TICK_RATE_MS) return
        this.gasDamageElapsed %= SAULO_GAS_DOT_TICK_RATE_MS
        if (this.gasClouds.length === 0) return

        for (const enemy of this.getValidEnemies()) {
            if (!this.isEnemyInsideGas(enemy)) continue

            new Dot({
                abilityName: "Poison Gas",
                damageType: "poison",
                duration: SAULO_GAS_DOT_DURATION_MS,
                target: enemy,
                tickDamage: calculateSauloPoisonGasTickDamage(this.abilityPower),
                tickRate: SAULO_GAS_DOT_TICK_RATE_MS,
                user: this,
            }).start()
        }
    }

    private isEnemyInsideGas(enemy: Creature): boolean {
        for (const cloud of this.gasClouds) {
            if (Phaser.Math.Distance.Between(cloud.x, cloud.y, enemy.x, enemy.y) <= SAULO_GAS_RADIUS) return true
        }

        return false
    }

    private trackRoundFx<T extends RoundFxObject>(object: T): T {
        this.scene.perRoundFx.add(object)
        return object
    }

    private destroyRoundFx(object?: RoundFxObject): void {
        if (!object) return

        this.scene.perRoundFx.remove(object, false, false)
        if (object.scene) object.destroy(true)
    }

    private cleanupGasClouds(): void {
        for (const cloud of this.gasClouds) {
            this.destroyRoundFx(cloud.graphic)
        }
        this.gasClouds.length = 0
        this.gasEmitElapsed = 0
        this.gasDamageElapsed = 0
    }

    private cleanupSauloState(): void {
        this.cleanupGasClouds()
        this.cleanupSpeedBoost()
        this.clearSingleTargetPatrol()
        this.clearCrossing()
        this.lastGasPosition = undefined
        this.overdriveHot = undefined
    }
}
