import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { Creature } from "../Creature"
import {
    calculateCloverDarkCleaveDamage,
    clampCloverDarkCleaveLength,
    clampCloverDarkCleaveRange,
    CLOVER_DARK_CLEAVE_HIT_RADIUS,
    CLOVER_DARK_CLEAVE_MAX_ANGLE_OFFSET,
    CLOVER_DARK_CLEAVE_MAX_LENGTH,
    CLOVER_DARK_CLEAVE_MAX_RANGE,
    CLOVER_DARK_CLEAVE_MIN_LENGTH,
    CLOVER_DARK_CLEAVE_MIN_RANGE,
    CLOVER_DARK_CLEAVE_SPEED,
    doesCloverDarkCleaveSegmentHit,
} from "./CloverDarkCleave"

type ZoneWithBody = Phaser.GameObjects.Zone & { body?: Phaser.Physics.Arcade.Body }

const darkCleaveCoreColor = 0x050409
const darkCleaveOutlineColor = 0x5f1111
const darkCleaveGlowColor = 0xb91c1c
const darkCleaveHitboxSize = 22

export class Clover extends Character {
    baseAttackSpeed = 0.85
    baseAttackDamage = 28
    baseAttackRange = 1
    baseMaxHealth = 360
    baseArmor = 5
    baseMaxMana = 90
    baseManaPerSecond = 8
    baseManaPerAttack = 12

    abilityName = "Dark Cleave"

    constructor(scene: Game, id: string) {
        super(scene, "clover", id)
    }

    override getAbilityDescription(): string {
        return `Clover drives his greatsword down and fires a dark energy cleave through his current target. The cleave pierces enemies, dealing [error.main:${Math.round(
            calculateCloverDarkCleaveDamage(this.attackDamage)
        )} (200% AD)] dark damage to each enemy hit.`
    }

    override castAbility(multiplier = 1): boolean | void {
        const target = this.getDarkCleaveTarget()
        if (!target) {
            this.target = undefined
            return false
        }

        this.casting = true
        this.target = target
        this.updateFacingDirection()
        this.playCastingAnimation()
        this.launchDarkCleave(target, multiplier)
    }

    private getDarkCleaveTarget(): Creature | undefined {
        if (this.target?.active && this.target.canBeTargeted) return this.target

        this.newTarget()
        if (this.target?.active && this.target.canBeTargeted) return this.target

        const fallbackTarget = this.getClosestEnemy()
        if (fallbackTarget?.active && fallbackTarget.canBeTargeted) {
            this.target = fallbackTarget
            this.updateFacingDirection()
            return fallbackTarget
        }

        return undefined
    }

    private playCastingAnimation(): void {
        const key = `${this.getAnimationTextureName()}-casting-${this.facing}`
        this.play({ key, frameRate: 14, repeat: 0 }, true)
    }

    private launchDarkCleave(target: Creature, multiplier: number): void {
        const origin = this.getDarkCleaveOrigin()
        const baseAngle = Phaser.Math.Angle.Between(origin.x, origin.y, target.x, target.y)
        const angle = this.pickAngleThroughTarget(origin, target, baseAngle)
        const distanceToTarget = Phaser.Math.Distance.Between(origin.x, origin.y, target.x, target.y)
        const range = clampCloverDarkCleaveRange(distanceToTarget, Phaser.Math.Between(CLOVER_DARK_CLEAVE_MIN_RANGE, CLOVER_DARK_CLEAVE_MAX_RANGE))
        const length = clampCloverDarkCleaveLength(Phaser.Math.Between(CLOVER_DARK_CLEAVE_MIN_LENGTH, CLOVER_DARK_CLEAVE_MAX_LENGTH))
        const direction = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle))
        const normal = new Phaser.Math.Vector2(-direction.y, direction.x)
        const hitbox = this.scene.add.zone(origin.x, origin.y, darkCleaveHitboxSize, darkCleaveHitboxSize) as ZoneWithBody
        const graphic = this.scene.add.graphics().setDepth(this.depth + 12).setBlendMode(Phaser.BlendModes.ADD)
        const hitEnemies = new Set<Creature>()
        const startedAt = this.scene.time.now
        const maxDuration = (range / CLOVER_DARK_CLEAVE_SPEED) * 1000 + 160
        let cleaned = false
        let wallCollider: Phaser.Physics.Arcade.Collider | undefined
        let lifespanTimer: Phaser.Time.TimerEvent | undefined

        this.scene.perRoundFx.add(hitbox)
        this.scene.perRoundFx.add(graphic)
        this.scene.physics.add.existing(hitbox)

        const body = hitbox.body
        if (!body) {
            hitbox.destroy(true)
            graphic.destroy(true)
            this.casting = false
            return
        }

        body.allowGravity = false
        body.setCircle(darkCleaveHitboxSize / 2)
        this.scene.physics.velocityFromRotation(angle, CLOVER_DARK_CLEAVE_SPEED, body.velocity)

        const cleanup = (destroyHitbox = true, destroyGraphic = true) => {
            if (cleaned) return
            cleaned = true

            this.scene.events.off("update", updateSlash)
            this.scene.events.off("gamestate", stopSlash)
            this.off("died", stopSlash)
            this.off("destroy", stopSlash)
            target.off("destroy", stopSlash)
            target.off("died", stopSlash)
            wallCollider?.destroy()
            lifespanTimer?.remove(false)
            lifespanTimer = undefined

            if (destroyHitbox && hitbox.active) hitbox.destroy(true)
            if (destroyGraphic && graphic.active) graphic.destroy(true)

            this.casting = false
        }
        const stopSlash = () => cleanup()
        const hitEnemy = (enemy: Creature) => {
            if (!this.active || !enemy.active || !enemy.canBeTargeted || hitEnemies.has(enemy)) return

            hitEnemies.add(enemy)
            const damage = this.calculateDamage(calculateCloverDarkCleaveDamage(this.attackDamage, multiplier))
            enemy.takeDamage(damage.value, this, "dark", damage.crit, true, this.abilityName)
            this.onHit(enemy)
        }
        const updateSlash = () => {
            if (!this.active || !hitbox.active || this.scene.state !== "fighting") {
                cleanup()
                return
            }

            const elapsed = this.scene.time.now - startedAt
            const traveled = Math.min(range, (elapsed / 1000) * CLOVER_DARK_CLEAVE_SPEED)
            const front = {
                x: origin.x + direction.x * traveled,
                y: origin.y + direction.y * traveled,
            }
            const backDistance = Math.max(0, traveled - length)
            const back = {
                x: origin.x + direction.x * backDistance,
                y: origin.y + direction.y * backDistance,
            }

            hitbox.setPosition(front.x, front.y)
            body.reset(front.x, front.y)
            body.setVelocity(direction.x * CLOVER_DARK_CLEAVE_SPEED, direction.y * CLOVER_DARK_CLEAVE_SPEED)
            this.drawDarkCleave(graphic, back, front, normal, length, elapsed)
            this.hitEnemiesTouchingSegment(back, front, hitEnemy)

            if (traveled >= range) cleanup()
        }

        wallCollider = this.scene.physics.add.collider(hitbox, this.scene.walls, () => cleanup())
        lifespanTimer = this.scene.time.delayedCall(maxDuration, () => cleanup())
        hitbox.once("destroy", () => cleanup(false, true))
        graphic.once("destroy", () => cleanup(true, false))
        this.scene.events.on("update", updateSlash)
        this.scene.events.once("gamestate", stopSlash)
        this.once("died", stopSlash)
        this.once("destroy", stopSlash)
        target.once("destroy", stopSlash)
        target.once("died", stopSlash)
        updateSlash()
    }

    private getDarkCleaveOrigin(): { x: number; y: number } {
        return { x: this.x, y: this.y - 18 }
    }

    private pickAngleThroughTarget(origin: { x: number; y: number }, target: Creature, baseAngle: number): number {
        const offsets = [
            Phaser.Math.FloatBetween(-CLOVER_DARK_CLEAVE_MAX_ANGLE_OFFSET, CLOVER_DARK_CLEAVE_MAX_ANGLE_OFFSET),
            Phaser.Math.FloatBetween(-CLOVER_DARK_CLEAVE_MAX_ANGLE_OFFSET * 0.55, CLOVER_DARK_CLEAVE_MAX_ANGLE_OFFSET * 0.55),
            0,
        ]
        const distance = Phaser.Math.Distance.Between(origin.x, origin.y, target.x, target.y)

        for (const offset of offsets) {
            const angle = baseAngle + offset
            const end = {
                x: origin.x + Math.cos(angle) * Math.max(distance + CLOVER_DARK_CLEAVE_HIT_RADIUS * 2, CLOVER_DARK_CLEAVE_MIN_RANGE),
                y: origin.y + Math.sin(angle) * Math.max(distance + CLOVER_DARK_CLEAVE_HIT_RADIUS * 2, CLOVER_DARK_CLEAVE_MIN_RANGE),
            }
            if (doesCloverDarkCleaveSegmentHit(this.getDarkCleaveHitPoint(target), origin, end)) return angle
        }

        return baseAngle
    }

    private getDarkCleaveHitPoint(creature: Creature): { x: number; y: number } {
        return { x: creature.x, y: creature.y - 14 }
    }

    private hitEnemiesTouchingSegment(start: { x: number; y: number }, end: { x: number; y: number }, hitEnemy: (enemy: Creature) => void): void {
        for (const enemy of this.getEnemyTeam().getChildren(true, true)) {
            if (!enemy.active || !enemy.canBeTargeted) continue
            if (doesCloverDarkCleaveSegmentHit(this.getDarkCleaveHitPoint(enemy), start, end)) hitEnemy(enemy)
        }
    }

    private drawDarkCleave(
        graphic: Phaser.GameObjects.Graphics,
        start: { x: number; y: number },
        end: { x: number; y: number },
        normal: Phaser.Math.Vector2,
        length: number,
        elapsed: number
    ): void {
        graphic.clear()

        const pulse = (Math.sin(elapsed * 0.035) + 1) * 0.5
        const midX = (start.x + end.x) / 2
        const midY = (start.y + end.y) / 2
        const curve = 10 + pulse * 8
        const controlX = midX + normal.x * curve
        const controlY = midY + normal.y * curve
        const tailWidth = Math.max(5, Math.min(14, length * 0.1))

        graphic.lineStyle(26, darkCleaveOutlineColor, 0.22)
        this.strokeQuadratic(graphic, start.x, start.y, controlX, controlY, end.x, end.y)
        graphic.lineStyle(14, darkCleaveCoreColor, 0.88)
        this.strokeQuadratic(graphic, start.x, start.y, controlX, controlY, end.x, end.y)
        graphic.lineStyle(5, darkCleaveOutlineColor, 0.9)
        this.strokeQuadratic(graphic, start.x, start.y, controlX, controlY, end.x, end.y)
        graphic.lineStyle(2, darkCleaveGlowColor, 0.78)
        this.strokeQuadratic(graphic, start.x, start.y, controlX, controlY, end.x, end.y)

        graphic.fillStyle(darkCleaveCoreColor, 0.55)
        graphic.fillCircle(end.x, end.y, tailWidth + pulse * 3)
        graphic.lineStyle(2, darkCleaveGlowColor, 0.65)
        graphic.strokeCircle(end.x, end.y, tailWidth + 3 + pulse * 2)
    }

    private strokeQuadratic(
        graphic: Phaser.GameObjects.Graphics,
        startX: number,
        startY: number,
        controlX: number,
        controlY: number,
        endX: number,
        endY: number
    ): void {
        let previousX = startX
        let previousY = startY

        for (let step = 1; step <= 10; step++) {
            const t = step / 10
            const inverse = 1 - t
            const x = inverse * inverse * startX + 2 * inverse * t * controlX + t * t * endX
            const y = inverse * inverse * startY + 2 * inverse * t * controlY + t * t * endY
            graphic.lineBetween(previousX, previousY, x, y)
            previousX = x
            previousY = y
        }
    }
}
