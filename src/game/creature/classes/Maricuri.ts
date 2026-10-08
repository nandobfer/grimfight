import { Dot } from "../../objects/StatusEffect/Dot"
import { Game } from "../../scenes/Game"
import { EventBus } from "../../tools/EventBus"
import { RNG } from "../../tools/RNG"
import { Character } from "../character/Character"
import { Creature } from "../Creature"
import {
    calculateMaricuriCloudDotTotalRawDamage,
    calculateMaricuriCloudTickDamage,
    calculateMaricuriFlaskTickDamage,
    calculateMaricuriFlaskTotalRawDamage,
    clampMaricuriPointToBounds,
    MARICURI_BIG_FLASK_AP_RATIO_PER_TICK,
    MARICURI_BIG_FLASK_CLOUD_DURATION_MS,
    MARICURI_BIG_FLASK_CLOUD_RADIUS,
    MARICURI_BIG_FLASK_CLOUD_TICK_RATE_MS,
    MARICURI_BIG_FLASK_DOT_DURATION_MS,
    MARICURI_BIG_FLASK_DOT_TICK_RATE_MS,
    MARICURI_BIG_FLASK_FLIGHT_MS,
    MARICURI_BIG_FLASK_PRIME_MS,
    MARICURI_FLASK_AP_RATIO_PER_TICK,
    MARICURI_FLASK_DOT_DURATION_MS,
    MARICURI_FLASK_DOT_TICK_RATE_MS,
    MARICURI_SMALL_FLASK_RADIUS,
    MARICURI_SMALL_FLASK_SCALE,
    type MaricuriBounds,
    type MaricuriPoint,
} from "./MaricuriAlchemy"

type RoundFxObject = Phaser.GameObjects.GameObject & { scene?: Phaser.Scene }

const flaskBurstMs = 200
const gasCloudDark = 0x1f5a2a
const gasCloudGreen = 0x4fbf4a
const gasCloudBright = 0xcaff65

interface MaricuriFlaskConfig {
    flightMs: number
    primeMs: number
    scale: number
    radius: number
}

interface MaricuriCloudConfig {
    radius: number
    dotTickDamage: number
    dotDurationMs: number
    dotTickRateMs: number
    cloudDurationMs: number
    cloudTickRateMs: number
    abilityName: string
}

/** Thrown flask: flies to a point, primes, detonates and hands off to a poison cloud. */
class MaricuriFlaskThrow {
    private readonly graphic: Phaser.GameObjects.Graphics
    private point: MaricuriPoint
    private elapsed = 0
    private phase: "flying" | "priming" | "bursting" = "flying"
    private burstElapsed = 0
    private detonated = false
    private cleaned = false

    private readonly onOwnerDestroy = () => this.cleanup()
    private readonly onRoundStateChange = () => this.cleanup()

    private readonly update = (_time: number, delta: number) => {
        if (this.cleaned || !this.graphic.active || this.owner.scene.state !== "fighting") {
            this.cleanup()
            return
        }

        this.elapsed += delta
        this.advance(delta)
        if (this.cleaned) return
        this.draw()
    }

    constructor(
        private readonly scene: Game,
        private readonly owner: Maricuri,
        private readonly startX: number,
        private readonly startY: number,
        point: MaricuriPoint,
        private readonly config: MaricuriFlaskConfig,
        private readonly onDetonate: (x: number, y: number) => void,
        private readonly onCleanup: () => void
    ) {
        this.point = { ...point }
        this.graphic = scene.add.graphics().setDepth(owner.depth + 12).setBlendMode(Phaser.BlendModes.ADD)
        this.trackRoundFx(this.graphic)

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

        this.destroyRoundFx(this.graphic)
        this.onCleanup()
    }

    private advance(delta: number): void {
        if (this.phase === "flying" && this.elapsed >= this.config.flightMs) {
            this.phase = "priming"
        }

        if (this.phase === "priming" && this.elapsed >= this.config.flightMs + this.config.primeMs) {
            this.phase = "bursting"
            this.burstElapsed = 0
        }

        if (this.phase === "bursting") {
            if (!this.detonated) {
                this.detonated = true
                this.onDetonate(this.point.x, this.point.y)
            }

            this.burstElapsed += delta
            if (this.burstElapsed >= flaskBurstMs) {
                this.cleanup()
            }
        }
    }

    private currentPosition(): MaricuriPoint {
        if (this.phase === "flying") {
            const t = Phaser.Math.Clamp(this.elapsed / this.config.flightMs, 0, 1)
            const eased = Phaser.Math.Easing.Quadratic.Out(t)
            return {
                x: Phaser.Math.Linear(this.startX, this.point.x, eased),
                y: Phaser.Math.Linear(this.startY, this.point.y, eased) - Math.sin(t * Math.PI) * 26 * this.config.scale,
            }
        }

        return this.point
    }

    private draw(): void {
        const { x, y } = this.currentPosition()
        const scale = this.config.scale
        const spin = this.phase === "flying" ? this.elapsed * 0.02 : 0
        const pulse = (Math.sin(this.elapsed * 0.02) + 1) * 0.5

        this.graphic.clear()

        if (this.phase === "bursting") {
            const progress = Phaser.Math.Clamp(this.burstElapsed / flaskBurstMs, 0, 1)
            const alpha = 1 - progress
            const radius = 10 + progress * (this.config.radius * 0.5)
            this.graphic.fillStyle(gasCloudGreen, 0.4 * alpha)
            this.graphic.fillCircle(x, y, radius)
            this.graphic.lineStyle(3, gasCloudBright, 0.7 * alpha)
            this.graphic.strokeCircle(x, y, radius * 0.8)
            return
        }

        if (this.phase === "priming") {
            this.graphic.fillStyle(gasCloudGreen, 0.22 + pulse * 0.18)
            this.graphic.fillCircle(x, y, (16 + pulse * 6) * scale)
        }

        this.graphic.save()
        this.graphic.translateCanvas(x, y)
        this.graphic.rotateCanvas(spin)

        this.graphic.fillStyle(0x1f5a2a, 0.3)
        this.graphic.fillEllipse(0, 0, 20 * scale, 26 * scale)
        this.graphic.fillStyle(0xcfe8ff, 0.92)
        this.graphic.fillEllipse(0, 0, 16 * scale, 22 * scale)
        this.graphic.fillStyle(0x7ed957, 0.95)
        this.graphic.fillEllipse(0, 3.5 * scale, 13 * scale, 13 * scale)
        this.graphic.fillStyle(0xcaff65, 0.85)
        this.graphic.fillEllipse(-2 * scale, 1.5 * scale, 5 * scale, 5.5 * scale)
        this.graphic.fillStyle(0xcfe8ff, 0.92)
        this.graphic.fillRect(-4 * scale, -14 * scale, 8 * scale, 6 * scale)
        this.graphic.fillStyle(0xd9a441, 1)
        this.graphic.fillRect(-4.6 * scale, -17 * scale, 9.2 * scale, 3.6 * scale)
        this.graphic.lineStyle(1.4 * scale, 0x5f7f9e, 0.9)
        this.graphic.strokeEllipse(0, 0, 16 * scale, 22 * scale)
        this.graphic.fillStyle(0xffffff, 0.85)
        this.graphic.fillCircle(-4.4 * scale, -4.4 * scale, 2 * scale)

        this.graphic.restore()
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

/** Lingering poison cloud that periodically applies a stackable poison Dot to enemies inside. */
class MaricuriGasCloud {
    private readonly graphic: Phaser.GameObjects.Graphics
    private age = 0
    private damageElapsed = 0
    private readonly seed = Phaser.Math.FloatBetween(0, Math.PI * 2)
    private cleaned = false

    private readonly onOwnerDestroy = () => this.cleanup()
    private readonly onRoundStateChange = () => this.cleanup()

    private readonly update = (time: number, delta: number) => {
        if (this.cleaned || !this.graphic.active || this.owner.scene.state !== "fighting") {
            this.cleanup()
            return
        }

        this.age += delta
        if (this.age >= this.config.cloudDurationMs) {
            this.cleanup()
            return
        }

        this.damageElapsed += delta
        this.applyDamage()
        this.draw(time)
    }

    constructor(
        private readonly scene: Game,
        private readonly owner: Maricuri,
        private readonly x: number,
        private readonly y: number,
        private readonly config: MaricuriCloudConfig,
        private readonly onCleanup: () => void
    ) {
        this.graphic = scene.add.graphics().setDepth(owner.depth - 1).setBlendMode(Phaser.BlendModes.ADD)
        this.trackRoundFx(this.graphic)

        scene.events.on("update", this.update)
        EventBus.once("gamestate", this.onRoundStateChange)
        owner.once("destroy", this.onOwnerDestroy)

        // First application happens on the first tick after the cloud appears.
        this.damageElapsed = this.config.cloudTickRateMs
        this.draw(scene.time.now)
    }

    cleanup(): void {
        if (this.cleaned) return
        this.cleaned = true

        this.scene.events.off("update", this.update)
        EventBus.off("gamestate", this.onRoundStateChange)
        this.owner.off("destroy", this.onOwnerDestroy)

        this.destroyRoundFx(this.graphic)
        this.onCleanup()
    }

    private applyDamage(): void {
        if (this.damageElapsed < this.config.cloudTickRateMs) return
        this.damageElapsed %= this.config.cloudTickRateMs

        for (const enemy of this.owner.getValidEnemies()) {
            if (Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) > this.config.radius) continue

            new Dot({
                abilityName: this.config.abilityName,
                damageType: "poison",
                duration: this.config.dotDurationMs,
                target: enemy,
                tickDamage: this.config.dotTickDamage,
                tickRate: this.config.dotTickRateMs,
                user: this.owner,
            }).start()
        }
    }

    private draw(time: number): void {
        const radius = this.config.radius
        const progress = Phaser.Math.Clamp(this.age / this.config.cloudDurationMs, 0, 1)
        const alpha = (1 - progress) * 0.34
        const pulse = (Math.sin(time * 0.008 + this.seed) + 1) * 0.5

        this.graphic.clear()
        this.graphic.fillStyle(gasCloudDark, alpha * 0.55)
        this.graphic.fillEllipse(this.x, this.y + radius * 0.14, radius * 1.5, radius * 0.56)
        this.graphic.fillStyle(gasCloudGreen, alpha)
        this.graphic.fillCircle(this.x - radius * 0.18 + pulse * radius * 0.09, this.y - radius * 0.09, radius * 0.38 + progress * radius * 0.18)
        this.graphic.fillCircle(this.x + radius * 0.2 - pulse * radius * 0.11, this.y, radius * 0.34 + progress * radius * 0.16)
        this.graphic.fillStyle(gasCloudBright, alpha * 0.6)
        this.graphic.fillCircle(this.x + Math.sin(time * 0.011 + this.seed) * radius * 0.22, this.y - radius * 0.22, radius * 0.09 + pulse * radius * 0.07)
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

export class Maricuri extends Character {
    baseAttackSpeed = 0.9
    baseAttackDamage = 0
    baseAttackRange = 4
    baseMaxHealth = 300
    baseArmor = 0
    baseMaxMana = 85
    baseManaPerSecond = 10
    baseAbilityPower = 50

    abilityName = "Alchemical Detonation"

    private readonly attackFlaskSource = "Acid Flask"
    private readonly effectCleanups = new Set<() => void>()

    private static readonly castFlaskConfig: MaricuriFlaskConfig = {
        flightMs: MARICURI_BIG_FLASK_FLIGHT_MS,
        primeMs: MARICURI_BIG_FLASK_PRIME_MS,
        scale: 1,
        radius: MARICURI_BIG_FLASK_CLOUD_RADIUS,
    }

    private static readonly attackFlaskConfig: MaricuriFlaskConfig = {
        flightMs: MARICURI_BIG_FLASK_FLIGHT_MS,
        primeMs: MARICURI_BIG_FLASK_PRIME_MS,
        scale: MARICURI_SMALL_FLASK_SCALE,
        radius: MARICURI_SMALL_FLASK_RADIUS,
    }

    constructor(scene: Game, id: string) {
        super(scene, "maricuri", id)
    }

    override getAbilityDescription(): string {
        const flaskDamage = Math.round(calculateMaricuriFlaskTotalRawDamage(this.abilityPower))
        const flaskRatio = Math.round(MARICURI_FLASK_AP_RATIO_PER_TICK * (MARICURI_FLASK_DOT_DURATION_MS / MARICURI_FLASK_DOT_TICK_RATE_MS) * 100)
        const cloudDamage = Math.round(calculateMaricuriCloudDotTotalRawDamage(this.abilityPower))
        const cloudRatio = Math.round(MARICURI_BIG_FLASK_AP_RATIO_PER_TICK * (MARICURI_BIG_FLASK_DOT_DURATION_MS / MARICURI_BIG_FLASK_DOT_TICK_RATE_MS) * 100)
        const cloudSeconds = MARICURI_BIG_FLASK_CLOUD_DURATION_MS / 1000

        return `Attacks lob a small alchemy flask that detonates after a moment into a [primary.main:poison cloud], dealing no direct damage but applying [info.main:${flaskDamage} poison damage] over time ([info.main:${flaskRatio}% AP]) to enemies inside. When casting [primary.main:${this.abilityName}], Maricuri lobs a large flask into the surroundings of a random enemy. It primes, then detonates into a much larger [primary.main:poison cloud] that lingers for [primary.main:${cloudSeconds} seconds], applying [info.main:${cloudDamage} poison damage] over time ([info.main:${cloudRatio}% AP]) to enemies inside.`
    }

    override landAttack(): void {
        const target = this.target
        if (!target?.active || !this.active) return

        // Credit the attack (mana per attack, afterAttack) — the damage comes from the cloud.
        this.onHit(target)

        const point = clampMaricuriPointToBounds(this.getArenaBounds(), target.randomPointAround())
        this.throwFlask(point, Maricuri.attackFlaskConfig, this.buildAttackCloudConfig())
    }

    override castAbility(multiplier = 1): boolean | void {
        if (!this.active) return false

        const enemies = this.getValidEnemies()
        if (enemies.length === 0) return false

        this.casting = true
        this.updateFacingDirection()
        this.playCastingAnimation()

        const enemy = RNG.pick(enemies)
        const point = clampMaricuriPointToBounds(this.getArenaBounds(), enemy.randomPointAround())

        this.throwFlask(point, Maricuri.castFlaskConfig, this.buildCastCloudConfig(multiplier))

        this.casting = false
    }

    override refreshStats(): void {
        this.cleanupEffects()
        super.refreshStats()
        this.gainMana(this.maxMana * 0.3)
    }

    override destroy(fromScene?: boolean): void {
        this.cleanupEffects()
        super.destroy(fromScene)
    }

    getValidEnemies(): Creature[] {
        return this.getEnemyTeam()
            .getChildren(true, true)
            .filter((enemy) => enemy.active && enemy.canBeTargeted) as Creature[]
    }

    private buildCastCloudConfig(multiplier: number): MaricuriCloudConfig {
        return {
            radius: MARICURI_BIG_FLASK_CLOUD_RADIUS,
            dotTickDamage: calculateMaricuriCloudTickDamage(this.abilityPower, multiplier),
            dotDurationMs: MARICURI_BIG_FLASK_DOT_DURATION_MS,
            dotTickRateMs: MARICURI_BIG_FLASK_DOT_TICK_RATE_MS,
            cloudDurationMs: MARICURI_BIG_FLASK_CLOUD_DURATION_MS,
            cloudTickRateMs: MARICURI_BIG_FLASK_CLOUD_TICK_RATE_MS,
            abilityName: this.abilityName,
        }
    }

    private buildAttackCloudConfig(): MaricuriCloudConfig {
        return {
            radius: MARICURI_SMALL_FLASK_RADIUS,
            dotTickDamage: calculateMaricuriFlaskTickDamage(this.abilityPower),
            dotDurationMs: MARICURI_FLASK_DOT_DURATION_MS,
            dotTickRateMs: MARICURI_FLASK_DOT_TICK_RATE_MS,
            cloudDurationMs: MARICURI_BIG_FLASK_CLOUD_DURATION_MS,
            cloudTickRateMs: MARICURI_BIG_FLASK_CLOUD_TICK_RATE_MS,
            abilityName: this.attackFlaskSource,
        }
    }

    private throwFlask(point: MaricuriPoint, flaskConfig: MaricuriFlaskConfig, cloudConfig: MaricuriCloudConfig): void {
        let cleanup = () => {}
        const flask = new MaricuriFlaskThrow(
            this.scene,
            this,
            this.x,
            this.y - 14,
            point,
            flaskConfig,
            (detonationX, detonationY) => this.spawnGasCloud(detonationX, detonationY, cloudConfig),
            () => this.effectCleanups.delete(cleanup)
        )
        cleanup = () => {
            flask.cleanup()
            this.effectCleanups.delete(cleanup)
        }
        this.effectCleanups.add(cleanup)
    }

    private spawnGasCloud(x: number, y: number, cloudConfig: MaricuriCloudConfig): void {
        let cleanup = () => {}
        const cloud = new MaricuriGasCloud(this.scene, this, x, y, cloudConfig, () => this.effectCleanups.delete(cleanup))
        cleanup = () => {
            cloud.cleanup()
            this.effectCleanups.delete(cleanup)
        }
        this.effectCleanups.add(cleanup)
    }

    private cleanupEffects(): void {
        for (const cleanup of [...this.effectCleanups]) {
            cleanup()
        }
        this.effectCleanups.clear()
    }

    private getArenaBounds(): MaricuriBounds {
        const first = this.scene.grid.cellToCenter(0, 0)
        const left = first.x - this.scene.grid.cellW / 2
        const top = first.y - this.scene.grid.cellH / 2

        return {
            left,
            top,
            right: left + this.scene.grid.cellW * this.scene.grid.cols,
            bottom: top + this.scene.grid.cellH * this.scene.grid.rows,
        }
    }

    private playCastingAnimation(): void {
        const key = `${this.getAnimationTextureName()}-casting-${this.facing}`
        this.play({ key, frameRate: 14, repeat: 0 }, true)
    }
}
