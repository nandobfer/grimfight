import { Creature } from "../../creature/Creature"
import {
    calculateLucioPoisonBubbleTickDamage,
    LUCIO_POISON_BUBBLE_DURATION_MS,
    LUCIO_POISON_BUBBLE_TICK_RATE_MS,
} from "../../creature/classes/LucioPoisonBubble"
import { Game } from "../../scenes/Game"
import { Dot } from "../StatusEffect/Dot"
import { Projectile } from "./Projectile"

const poisonBubbleTextureKey = "poison-bubble-hitbox"
const poisonBubbleVisualScale = 3
const poisonBubbleTrailLifetime = 360
const poisonBubbleTrailMinDistance = 5 * poisonBubbleVisualScale
const poisonBubbleSplashDuration = 320

interface TrailPoint {
    x: number
    y: number
    age: number
    radius: number
}

export class PoisonBubble extends Projectile {
    speed = 150
    destroyOnWallHit = true

    private readonly graphic: Phaser.GameObjects.Graphics
    private readonly trailGraphic: Phaser.GameObjects.Graphics
    private readonly trail: TrailPoint[] = []
    private readonly abilityName: string
    private readonly multiplier: number
    private readonly triggerOnHit: boolean
    private elapsed = 0
    private lastTrailX = 0
    private lastTrailY = 0
    private hasSplashed = false

    private readonly updateVisual = (_time: number, delta: number) => {
        if (!this.active || !this.graphic.active || !this.trailGraphic.active) return

        this.elapsed += delta
        this.addTrailPointIfNeeded()
        this.drawTrail(delta)
        this.drawBubble()
    }

    constructor(scene: Game, x: number, y: number, owner: Creature, abilityName: string, options: { multiplier?: number; triggerOnHit?: boolean } = {}) {
        PoisonBubble.ensureTexture(scene)
        super(scene, x, y, owner, poisonBubbleTextureKey, "poison", { flipX: false })

        this.abilityName = abilityName
        this.multiplier = options.multiplier ?? 1
        this.triggerOnHit = options.triggerOnHit ?? false

        this.setAlpha(0)
        this.setScale(1)
        this.setCircle(7 * poisonBubbleVisualScale)
        this.addLightEffect({
            color: 0x66ff99,
            intensity: 1.4,
            radius: 42 * poisonBubbleVisualScale,
            minIntensity: 0.65,
            maxIntensity: 1.8,
            duration: 520,
        })

        this.trailGraphic = scene.add.graphics().setDepth(this.depth - 1).setBlendMode(Phaser.BlendModes.ADD)
        this.graphic = scene.add.graphics().setDepth(this.depth + 1).setBlendMode(Phaser.BlendModes.ADD)
        this.lastTrailX = x
        this.lastTrailY = y
        this.drawBubble()

        scene.perRoundFx.add(this.trailGraphic)
        scene.perRoundFx.add(this.graphic)
        scene.events.on("update", this.updateVisual)
        this.once("destroy", () => {
            scene.events.off("update", this.updateVisual)
            scene.perRoundFx.remove(this.trailGraphic, false, false)
            scene.perRoundFx.remove(this.graphic, false, false)
            this.trailGraphic.destroy(true)
            this.graphic.destroy(true)
        })
    }

    private static ensureTexture(scene: Game): void {
        if (scene.textures.exists(poisonBubbleTextureKey)) return

        const graphic = scene.add.graphics({ x: 0, y: 0 })
        graphic.fillStyle(0xffffff, 1)
        graphic.fillCircle(8, 8, 8)
        graphic.generateTexture(poisonBubbleTextureKey, 16, 16)
        graphic.destroy(true)
    }

    fireAtAngle(angle: number, startX = this.owner.x, startY = this.owner.y): this {
        this.startX = startX
        this.startY = startY
        this.setPosition(startX, startY)
        this.setRotation(angle)
        this.setActive(true).setVisible(true)
        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity)

        this.lastTrailX = startX
        this.lastTrailY = startY
        this.addTrailPoint()
        return this
    }

    override fire(target: Creature, startX?: number, startY?: number): this {
        const fromX = startX ?? this.owner.x
        const fromY = startY ?? this.owner.y
        const angle = Phaser.Math.Angle.Between(fromX, fromY, target.x, target.y)
        return this.fireAtAngle(angle, fromX, fromY)
    }

    override onHit(target: Creature): void {
        if (!target?.active) {
            this.splashAndDestroy()
            return
        }

        new Dot({
            damageType: "poison",
            duration: LUCIO_POISON_BUBBLE_DURATION_MS,
            target,
            tickDamage: calculateLucioPoisonBubbleTickDamage(this.owner.abilityPower, this.multiplier),
            tickRate: LUCIO_POISON_BUBBLE_TICK_RATE_MS,
            user: this.owner,
            abilityName: this.abilityName,
        }).start()

        if (this.triggerOnHit) {
            this.owner.onHit(target)
        }

        this.splashAndDestroy()
    }

    override onHitWall(): void {
        this.setVelocity(0)
        this.splashAndDestroy()
    }

    private splashAndDestroy(): void {
        if (!this.hasSplashed) {
            this.hasSplashed = true
            spawnPoisonBubbleSplash(this.scene, this.x, this.y, poisonBubbleVisualScale)
        }

        this.destroy(true)
    }

    private addTrailPointIfNeeded(): void {
        if (Phaser.Math.Distance.Between(this.x, this.y, this.lastTrailX, this.lastTrailY) < poisonBubbleTrailMinDistance) return

        this.addTrailPoint()
    }

    private addTrailPoint(): void {
        this.trail.push({ x: this.x, y: this.y, age: 0, radius: Phaser.Math.FloatBetween(3, 6) * poisonBubbleVisualScale })
        this.lastTrailX = this.x
        this.lastTrailY = this.y
    }

    private drawTrail(delta: number): void {
        this.trailGraphic.clear()

        for (let index = this.trail.length - 1; index >= 0; index--) {
            const point = this.trail[index]
            point.age += delta
            if (point.age >= poisonBubbleTrailLifetime) {
                this.trail.splice(index, 1)
                continue
            }

            const life = 1 - point.age / poisonBubbleTrailLifetime
            this.trailGraphic.fillStyle(0x66ff99, 0.2 * life)
            this.trailGraphic.fillCircle(point.x, point.y, point.radius * life)
            this.trailGraphic.fillStyle(0x6b3fa0, 0.12 * life)
            this.trailGraphic.fillCircle(point.x + 1.5 * poisonBubbleVisualScale, point.y + poisonBubbleVisualScale, point.radius * 0.55 * life)
        }
    }

    private drawBubble(): void {
        const wobble = Math.sin(this.elapsed * 0.012) * 1.2 * poisonBubbleVisualScale

        this.graphic.clear()
        this.graphic.fillStyle(0x1f9f5b, 0.22)
        this.graphic.fillCircle(this.x, this.y, 12 * poisonBubbleVisualScale + wobble)
        this.graphic.fillStyle(0x66ff99, 0.48)
        this.graphic.fillCircle(this.x, this.y, 8 * poisonBubbleVisualScale + wobble * 0.5)
        this.graphic.lineStyle(1.6 * poisonBubbleVisualScale, 0x6b3fa0, 0.82)
        this.graphic.strokeCircle(this.x, this.y, 8 * poisonBubbleVisualScale + wobble * 0.5)
        this.graphic.fillStyle(0xd7ffd9, 0.82)
        this.graphic.fillCircle(this.x - 3 * poisonBubbleVisualScale, this.y - 4 * poisonBubbleVisualScale, 2.2 * poisonBubbleVisualScale)
        this.graphic.fillStyle(0xb78cff, 0.65)
        this.graphic.fillCircle(this.x + 3 * poisonBubbleVisualScale, this.y + 2 * poisonBubbleVisualScale, 1.8 * poisonBubbleVisualScale)
    }
}

function spawnPoisonBubbleSplash(scene: Game, x: number, y: number, scale: number): void {
    const graphic = scene.add.graphics().setDepth(10_000).setBlendMode(Phaser.BlendModes.ADD)
    const drops = Array.from({ length: 12 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 12 + Phaser.Math.FloatBetween(-0.18, 0.18)
        return {
            angle,
            distance: Phaser.Math.FloatBetween(12, 24) * scale,
            radius: Phaser.Math.FloatBetween(2.5, 5) * scale,
            wobble: Phaser.Math.FloatBetween(-3, 3) * scale,
        }
    })

    scene.perRoundFx.add(graphic)

    let tween: Phaser.Tweens.Tween | undefined
    const cleanup = (stopTween: boolean) => {
        scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanupOnShutdown)
        if (stopTween) tween?.stop()
        scene.perRoundFx.remove(graphic, false, false)
        graphic.destroy(true)
    }
    const cleanupOnShutdown = () => cleanup(true)

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupOnShutdown)
    tween = scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: poisonBubbleSplashDuration,
        ease: "Cubic.Out",
        onUpdate: tween => {
            const progress = tween.getValue()
            if (typeof progress !== "number") return

            drawPoisonBubbleSplashFrame(graphic, x, y, scale, drops, progress)
        },
        onComplete: () => {
            cleanup(false)
        },
    })
}

function drawPoisonBubbleSplashFrame(
    graphic: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
    drops: { angle: number; distance: number; radius: number; wobble: number }[],
    progress: number
): void {
    const alpha = 1 - progress
    const eased = Phaser.Math.Easing.Cubic.Out(progress)
    const centerRadius = (10 + 22 * eased) * scale
    const ringRadius = (8 + 26 * eased) * scale

    graphic.clear()
    graphic.fillStyle(0x1f9f5b, 0.26 * alpha)
    graphic.fillEllipse(x, y + 3 * scale, centerRadius * 1.35, centerRadius * 0.72)
    graphic.lineStyle(2.2 * scale, 0x66ff99, 0.42 * alpha)
    graphic.strokeEllipse(x, y, ringRadius * 1.25, ringRadius * 0.82)
    graphic.lineStyle(1.2 * scale, 0x6b3fa0, 0.36 * alpha)
    graphic.strokeCircle(x, y, ringRadius * 0.72)

    for (const drop of drops) {
        const distance = drop.distance * eased
        const dropX = x + Math.cos(drop.angle) * distance
        const dropY = y + Math.sin(drop.angle) * distance + drop.wobble * Math.sin(progress * Math.PI)
        const radius = drop.radius * (1 - progress * 0.55)

        graphic.fillStyle(0x66ff99, 0.42 * alpha)
        graphic.fillCircle(dropX, dropY, radius)
        graphic.fillStyle(0x6b3fa0, 0.18 * alpha)
        graphic.fillCircle(dropX + radius * 0.28, dropY + radius * 0.18, radius * 0.55)
        graphic.fillStyle(0xd7ffd9, 0.52 * alpha)
        graphic.fillCircle(dropX - radius * 0.25, dropY - radius * 0.3, Math.max(1, radius * 0.22))
    }
}
