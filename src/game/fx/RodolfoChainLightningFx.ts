import Phaser from "phaser"
import { Creature } from "../creature/Creature"
import { Game } from "../scenes/Game"

const chainColorDark = 0x1e3a8a
const chainColorMid = 0x3b82f6
const chainColorBright = 0xdbeafe
const totalMs = 380

interface ChainPoint {
    x: number
    y: number
}

/**
 * Chain lightning drawn entirely with Phaser Graphics. Every target is linked
 * at once (no projectile travelling between enemies): the caster and the
 * ordered targets are connected by jagged bolts that flicker for a moment.
 */
export class RodolfoChainLightningFx {
    private readonly scene: Game
    private readonly caster: Creature
    private readonly source: string
    private readonly anchors: ChainPoint[]

    private readonly graphic: Phaser.GameObjects.Graphics
    private light?: Phaser.GameObjects.Light
    private tween?: Phaser.Tweens.Tween
    private lightTween?: Phaser.Tweens.Tween
    private cleaned = false

    private readonly stop = () => this.cleanup()

    constructor(caster: Creature, targets: Creature[], source: string, damageForJump: (jumpIndex: number) => number) {
        this.caster = caster
        this.scene = caster.scene
        this.source = source

        this.anchors = [
            { x: caster.x, y: caster.y - 20 },
            ...targets.map((target) => ({ x: target.x, y: target.y - 14 })),
        ]

        this.applyDamage(targets, damageForJump)

        const depth = (this.scene.grid.worldToCell(caster.x, caster.y)?.row ?? 0) + 3
        this.graphic = this.scene.add.graphics().setDepth(depth).setBlendMode(Phaser.BlendModes.ADD)
        this.scene.perRoundFx.add(this.graphic)

        if (this.scene.lights) {
            const first = this.anchors[1] ?? this.anchors[0]
            this.light = this.scene.lights.addLight(first.x, first.y, 90, chainColorMid, 5)
            this.lightTween = this.scene.tweens.add({
                targets: this.light,
                radius: { from: 40, to: 110 },
                intensity: { from: 6, to: 1 },
                duration: totalMs,
                ease: "Sine.easeOut",
            })
        }

        this.scene.events.once("gamestate", this.stop)
        this.graphic.once("destroy", () => this.cleanup(false))

        this.tween = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: totalMs,
            ease: "Linear",
            onUpdate: (activeTween: Phaser.Tweens.Tween) => this.draw(activeTween.getValue() as number),
            onComplete: () => this.cleanup(),
            onStop: () => this.cleanup(),
        })
    }

    private applyDamage(targets: Creature[], damageForJump: (jumpIndex: number) => number): void {
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i]
            if (!target.active) continue

            const { value, crit } = this.caster.calculateDamage(damageForJump(i))
            target.takeDamage(value, this.caster, "lightning", crit, true, this.source)
        }
    }

    private draw(progress: number): void {
        if (this.cleaned) return

        this.graphic.clear()

        // Hold bright, then fade out over the last third.
        const fade = progress < 0.66 ? 1 : 1 - (progress - 0.66) / 0.34
        const jitter = 14 * (1 - progress * 0.6)

        for (let i = 1; i < this.anchors.length; i++) {
            const points = this.buildBolt(this.anchors[i - 1], this.anchors[i], jitter)

            this.graphic.lineStyle(7, chainColorDark, 0.3 * fade)
            this.strokePoints(points)
            this.graphic.lineStyle(3, chainColorMid, 0.8 * fade)
            this.strokePoints(points)
            this.graphic.lineStyle(1.2, chainColorBright, 0.95 * fade)
            this.strokePoints(points)
        }

        this.graphic.fillStyle(chainColorMid, 0.5 * fade)
        this.graphic.fillCircle(this.anchors[0].x, this.anchors[0].y, 7)

        for (let i = 1; i < this.anchors.length; i++) {
            const anchor = this.anchors[i]
            const pulse = 4 + Math.sin(progress * Math.PI * 6 + i) * 1.5
            this.graphic.fillStyle(chainColorBright, 0.85 * fade)
            this.graphic.fillCircle(anchor.x, anchor.y, pulse)
            this.graphic.lineStyle(2, chainColorMid, 0.7 * fade)
            this.graphic.strokeCircle(anchor.x, anchor.y, pulse + 3)
        }
    }

    private buildBolt(from: ChainPoint, to: ChainPoint, jitter: number): ChainPoint[] {
        const points: ChainPoint[] = [from]
        const distance = Math.hypot(to.x - from.x, to.y - from.y)
        const segments = Math.max(3, Math.floor(distance / 18))
        const nx = -(to.y - from.y)
        const ny = to.x - from.x
        const length = Math.hypot(nx, ny) || 1

        for (let i = 1; i < segments; i++) {
            const t = i / segments
            const baseX = from.x + (to.x - from.x) * t
            const baseY = from.y + (to.y - from.y) * t
            const offset = Phaser.Math.FloatBetween(-jitter, jitter)

            points.push({ x: baseX + (nx / length) * offset, y: baseY + (ny / length) * offset })
        }

        points.push(to)
        return points
    }

    private strokePoints(points: ChainPoint[]): void {
        this.graphic.beginPath()
        this.graphic.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
            this.graphic.lineTo(points[i].x, points[i].y)
        }
        this.graphic.strokePath()
    }

    private cleanup(destroyGraphic = true): void {
        if (this.cleaned) return

        this.cleaned = true
        this.scene.events.off("gamestate", this.stop)

        if (this.tween) {
            this.tween.stop()
            this.scene.tweens.remove(this.tween)
            this.tween = undefined
        }

        if (this.lightTween) {
            this.lightTween.stop()
            this.scene.tweens.remove(this.lightTween)
            this.lightTween = undefined
        }

        if (this.light) {
            this.scene.lights?.removeLight(this.light)
            this.light = undefined
        }

        if (destroyGraphic && this.graphic.active) {
            this.graphic.destroy(true)
        }
    }
}
