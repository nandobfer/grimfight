import { Arrow } from "../../objects/Projectile/Arrow"
import { Dot } from "../../objects/StatusEffect/Dot"
import { Game } from "../../scenes/Game"
import { EventBus } from "../../tools/EventBus"
import { Character } from "../character/Character"
import { Creature } from "../Creature"
import { NALA_SERPENT_COUNT, NALA_SERPENT_DOT_AD_RATIO_PER_TICK, NALA_SERPENT_DOT_AP_RATIO_PER_TICK, NALA_SERPENT_DOT_DURATION_MS, NALA_SERPENT_DOT_TICK_RATE_MS, NALA_SERPENT_DURATION_MS, NALA_SERPENT_HOMING_DELAY_MS, NALA_SERPENT_IMPACT_AD_RATIO, NALA_SERPENT_IMPACT_AP_RATIO, calculateNalaSerpentDotTickDamage, calculateNalaSerpentDotTotalRawDamage, calculateNalaSerpentImpactDamage } from './NalaSerpents';

const serpentHitboxSize = 14
const serpentInitialSpeed = 210
const serpentHomingSpeed = 340
const serpentTurnLerp = 0.24

type ZoneWithBody = Phaser.GameObjects.Zone & { body?: Phaser.Physics.Arcade.Body }
type RoundFxObject = Phaser.GameObjects.GameObject & { scene?: Phaser.Scene }

class NalaHomingSerpent {
    private readonly hitbox: ZoneWithBody
    private readonly graphic: Phaser.GameObjects.Graphics
    private readonly colliders: Phaser.Physics.Arcade.Collider[] = []
    private lifespanTimer?: Phaser.Time.TimerEvent
    private cleaned = false
    private elapsed = 0
    private currentAngle: number

    private readonly onOwnerDestroy = () => this.cleanup()

    private readonly update = (_time: number, delta: number) => {
        if (this.cleaned || !this.hitbox.active || !this.owner.active || this.owner.scene.state !== "fighting") {
            this.cleanup()
            return
        }

        this.elapsed += delta

        if (this.elapsed >= NALA_SERPENT_HOMING_DELAY_MS) {
            const target = this.getHomingTarget()
            if (!target) {
                this.cleanup()
                return
            }

            const targetAngle = Phaser.Math.Angle.Between(this.hitbox.x, this.hitbox.y, target.x, target.y)
            this.currentAngle = Phaser.Math.Angle.RotateTo(this.currentAngle, targetAngle, serpentTurnLerp)
            this.scene.physics.velocityFromRotation(this.currentAngle, serpentHomingSpeed, this.hitbox.body?.velocity)
        }

        this.draw()
    }

    private readonly onRoundStateChange = () => this.cleanup()

    constructor(
        private readonly scene: Game,
        private readonly owner: Nala,
        x: number,
        y: number,
        angle: number,
        private readonly multiplier: number,
        private readonly onCleanup: () => void
    ) {
        this.currentAngle = angle
        this.hitbox = scene.add.zone(x, y, serpentHitboxSize, serpentHitboxSize) as ZoneWithBody
        this.graphic = scene.add.graphics().setDepth(owner.depth + 10).setBlendMode(Phaser.BlendModes.ADD)

        this.trackRoundFx(this.hitbox)
        this.trackRoundFx(this.graphic)
        scene.physics.add.existing(this.hitbox)

        const body = this.hitbox.body
        if (!body) {
            this.cleanup()
            return
        }

        body.allowGravity = false
        body.setCircle(serpentHitboxSize / 2)
        scene.physics.velocityFromRotation(angle, serpentInitialSpeed, body.velocity)

        this.addOverlap(owner.getEnemyTeam())
        this.addOverlap(owner.getEnemyTeam().minions)

        this.lifespanTimer = scene.time.addEvent({ delay: NALA_SERPENT_DURATION_MS, callback: () => this.cleanup() })
        scene.events.on("update", this.update)
        EventBus.once("gamestate", this.onRoundStateChange)
        owner.once("destroy", this.onOwnerDestroy)

        this.draw()
    }

    cleanup(): void {
        if (this.cleaned) return
        this.cleaned = true

        this.scene.events.off("update", this.update)
        EventBus.off("gamestate", this.onRoundStateChange)
        this.owner.off("destroy", this.onOwnerDestroy)

        if (this.lifespanTimer) {
            this.lifespanTimer.remove(false)
            this.lifespanTimer = undefined
        }

        for (const collider of this.colliders) {
            collider.destroy()
        }
        this.colliders.length = 0

        this.destroyRoundFx(this.hitbox)
        this.destroyRoundFx(this.graphic)
        this.onCleanup()
    }

    private addOverlap(group: Phaser.GameObjects.Group): void {
        const overlap = this.scene.physics.add.overlap(this.hitbox, group, (_hitbox, enemyObj) => {
            const enemy = enemyObj as Creature
            if (!enemy.active || this.cleaned) return

            this.onHit(enemy)
        })
        this.colliders.push(overlap)
    }

    private onHit(target: Creature): void {
        const impact = this.owner.calculateDamage(calculateNalaSerpentImpactDamage(this.owner.attackDamage, this.owner.abilityPower, this.multiplier))
        target.takeDamage(impact.value, this.owner, "poison", impact.crit, true, this.owner.abilityName)

        new Dot({
            damageType: "poison",
            duration: NALA_SERPENT_DOT_DURATION_MS,
            target,
            tickDamage: calculateNalaSerpentDotTickDamage(this.owner.attackDamage, this.owner.abilityPower, this.multiplier),
            tickRate: NALA_SERPENT_DOT_TICK_RATE_MS,
            user: this.owner,
            abilityName: this.owner.abilityName,
        }).start()

        this.spawnPoisonSplash(this.hitbox.x, this.hitbox.y)
        this.cleanup()
    }

    private spawnPoisonSplash(x: number, y: number): void {
        const splash = this.scene.add.graphics().setDepth(this.owner.depth + 11).setBlendMode(Phaser.BlendModes.ADD)
        let cleaned = false
        let tween: Phaser.Tweens.Tween | undefined

        const drawSplash = (progress: number) => {
            const life = 1 - progress
            const radius = 6 + progress * 18

            splash.clear()
            splash.fillStyle(0x7ed957, 0.3 * life)
            splash.fillCircle(x, y, radius)
            splash.lineStyle(2, 0xcaff65, 0.75 * life)
            splash.strokeCircle(x, y, radius * 0.72)
            splash.fillStyle(0xdcff8a, 0.85 * life)
            splash.fillCircle(x, y, Math.max(2, 5 * life))

            for (let index = 0; index < 6; index++) {
                const angle = (Math.PI * 2 * index) / 6 + progress * 0.7
                const dropDistance = 7 + progress * 15
                const dropX = x + Math.cos(angle) * dropDistance
                const dropY = y + Math.sin(angle) * dropDistance
                splash.fillStyle(index % 2 === 0 ? 0x9cff57 : 0x37b24d, 0.65 * life)
                splash.fillCircle(dropX, dropY, Math.max(1.2, 3.2 * life))
            }
        }

        const cleanup = () => {
            if (cleaned) return
            cleaned = true
            EventBus.off("gamestate", cleanup)
            if (tween) {
                tween.stop()
                this.scene.tweens.remove(tween)
                tween = undefined
            }
            this.scene.perRoundFx.remove(splash, false, false)
            if (splash.scene) {
                splash.destroy(true)
            }
        }

        this.scene.perRoundFx.add(splash)
        EventBus.once("gamestate", cleanup)

        const state = { progress: 0 }
        drawSplash(state.progress)
        tween = this.scene.tweens.add({
            targets: state,
            progress: 1,
            duration: 260,
            ease: "Sine.easeOut",
            onUpdate: () => drawSplash(state.progress),
            onComplete: cleanup,
        })
    }

    private getHomingTarget(): Creature | undefined {
        if (this.owner.target?.active) return this.owner.target
        return this.owner.getClosestEnemy()
    }

    private draw(): void {
        const x = this.hitbox.x
        const y = this.hitbox.y
        const tailX = x - Math.cos(this.currentAngle) * 18
        const tailY = y - Math.sin(this.currentAngle) * 18
        const wave = Math.sin(this.elapsed * 0.028) * 5
        const sideX = Math.cos(this.currentAngle + Math.PI / 2) * wave
        const sideY = Math.sin(this.currentAngle + Math.PI / 2) * wave
        const headX = x + Math.cos(this.currentAngle) * 8
        const headY = y + Math.sin(this.currentAngle) * 8

        this.graphic.clear()
        this.graphic.lineStyle(7, 0x123817, 0.85)
        this.graphic.beginPath()
        this.graphic.moveTo(tailX, tailY)
        this.graphic.lineTo(x + sideX, y + sideY)
        this.graphic.lineTo(headX, headY)
        this.graphic.strokePath()

        this.graphic.lineStyle(3, 0x7ed957, 0.95)
        this.graphic.beginPath()
        this.graphic.moveTo(tailX, tailY)
        this.graphic.lineTo(x + sideX, y + sideY)
        this.graphic.lineTo(headX, headY)
        this.graphic.strokePath()

        this.graphic.fillStyle(0xcaff65, 0.95)
        this.graphic.fillCircle(headX, headY, 4.2)
        this.graphic.fillStyle(0x203514, 0.9)
        this.graphic.fillCircle(headX + Math.cos(this.currentAngle + 0.7) * 2.2, headY + Math.sin(this.currentAngle + 0.7) * 2.2, 1)
        this.graphic.fillCircle(headX + Math.cos(this.currentAngle - 0.7) * 2.2, headY + Math.sin(this.currentAngle - 0.7) * 2.2, 1)
    }

    private trackRoundFx<T extends RoundFxObject>(object: T): T {
        this.scene.perRoundFx.add(object)
        return object
    }

    private destroyRoundFx(object: RoundFxObject): void {
        this.scene.perRoundFx.remove(object, false, false)
        if (object.scene) {
            object.destroy(true)
        }
    }
}

export class Nala extends Character {
    baseAttackSpeed = 1.05
    baseAttackDamage = 18
    baseAttackRange = 4
    baseMaxHealth = 220
    baseMaxMana = 80
    baseAbilityPower = 45
    baseManaPerSecond = 6

    abilityName = "Serpent Volley"

    private readonly serpentCleanups = new Set<() => void>()

    constructor(scene: Game, id: string) {
        super(scene, "nala", id)
    }

    override getAbilityDescription(): string {
        const impactDamage = Math.round(calculateNalaSerpentImpactDamage(this.attackDamage, this.abilityPower))
        const dotDamage = Math.round(calculateNalaSerpentDotTotalRawDamage(this.attackDamage, this.abilityPower))
        const dotTicks = NALA_SERPENT_DOT_DURATION_MS / NALA_SERPENT_DOT_TICK_RATE_MS
        const dotAdRatio = Math.round(NALA_SERPENT_DOT_AD_RATIO_PER_TICK * dotTicks * 100)
        const dotApRatio = Math.round(NALA_SERPENT_DOT_AP_RATIO_PER_TICK * dotTicks * 100)

        return `Fires [primary.main:${NALA_SERPENT_COUNT} homing venom snakes] in random directions. Each snake deals [info.main:${impactDamage} poison damage] on impact ([error.main:${Math.round(
            NALA_SERPENT_IMPACT_AD_RATIO * 100
        )}% AD] + [info.main:${Math.round(
            NALA_SERPENT_IMPACT_AP_RATIO * 100
        )}% AP]) and applies [info.main:${dotDamage} poison damage] over time ([error.main:${dotAdRatio}% AD] + [info.main:${dotApRatio}% AP]).`
    }

    override landAttack(): void {
        const target = this.target
        if (!target?.active || !this.active) return

        new Arrow(this.scene, this.x, this.y, this).fire(target)
    }

    override castAbility(multiplier = 1): boolean | void {
        if (!this.active || !this.target?.active) return false

        this.casting = true
        this.playCastingAnimation()

        const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y)

        for (let index = 0; index < NALA_SERPENT_COUNT; index++) {
            const angle = baseAngle + Phaser.Math.FloatBetween(-0.9, 0.9)
            let cleanup = () => {}
            const serpent = new NalaHomingSerpent(this.scene, this, this.x, this.y - 12, angle, multiplier, () => {
                this.serpentCleanups.delete(cleanup)
            })
            cleanup = () => {
                serpent.cleanup()
                this.serpentCleanups.delete(cleanup)
            }
            this.serpentCleanups.add(cleanup)
        }

        this.casting = false
    }

    override refreshStats(): void {
        this.cleanupSerpents()
        super.refreshStats()
        this.gainMana(this.maxMana * 0.3)
    }

    override destroy(fromScene?: boolean): void {
        this.cleanupSerpents()
        super.destroy(fromScene)
    }

    private cleanupSerpents(): void {
        for (const cleanup of [...this.serpentCleanups]) {
            cleanup()
        }
        this.serpentCleanups.clear()
    }

    private playCastingAnimation(): void {
        const key = `${this.getAnimationTextureName()}-casting-${this.facing}`
        this.play({ key, frameRate: 14, repeat: 0 }, true)
    }
}
