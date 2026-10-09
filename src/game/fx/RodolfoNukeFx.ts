import Phaser from "phaser"
import { Creature } from "../creature/Creature"
import { Game } from "../scenes/Game"

const chargeMs = 320
const totalMs = 620

/**
 * Nuclear fireball drawn entirely with Phaser Graphics. It charges for a short
 * window, then detonates once: every enemy inside the radius takes fire damage.
 */
export class RodolfoNukeFx {
    private readonly scene: Game
    private readonly caster: Creature
    private readonly x: number
    private readonly y: number
    private readonly baseDamage: number
    private readonly radius: number
    private readonly source: string

    private readonly graphic: Phaser.GameObjects.Graphics
    private light?: Phaser.GameObjects.Light
    private tween?: Phaser.Tweens.Tween
    private lightTween?: Phaser.Tweens.Tween
    private cleaned = false
    private damaged = false

    private readonly stop = () => this.cleanup()

    constructor(caster: Creature, x: number, y: number, baseDamage: number, radius: number, source: string) {
        this.caster = caster
        this.scene = caster.scene
        this.x = x
        this.y = y
        this.baseDamage = baseDamage
        this.radius = radius
        this.source = source

        const depth = (this.scene.grid.worldToCell(x, y)?.row ?? 0) + 2
        this.graphic = this.scene.add.graphics().setDepth(depth).setBlendMode(Phaser.BlendModes.ADD)
        this.scene.perRoundFx.add(this.graphic)

        if (this.scene.lights) {
            this.light = this.scene.lights.addLight(x, y, radius, 0xa855f7, 2)
            this.lightTween = this.scene.tweens.add({
                targets: this.light,
                radius: { from: radius * 0.3, to: radius * 1.2 },
                intensity: { from: 2, to: 8 },
                duration: totalMs,
                ease: "Sine.easeIn",
            })
        }

        this.scene.events.once("gamestate", this.stop)
        this.graphic.once("destroy", () => this.cleanup(false))

        this.tween = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: totalMs,
            ease: "Sine.easeIn",
            onUpdate: (activeTween: Phaser.Tweens.Tween) => this.draw(activeTween.getValue() as number),
            onComplete: () => this.cleanup(),
            onStop: () => this.cleanup(),
        })
    }

    private draw(progress: number): void {
        if (this.cleaned) return

        this.graphic.clear()

        const chargeRatio = chargeMs / totalMs

        if (progress < chargeRatio) {
            const charge = progress / chargeRatio
            this.graphic.fillStyle(0xd8b4fe, 0.25 + charge * 0.5)
            this.graphic.fillCircle(this.x, this.y, 6 + charge * 18)
            return
        }

        if (!this.damaged) this.damageEnemies()

        const t = (progress - chargeRatio) / (1 - chargeRatio)
        const eased = Phaser.Math.Easing.Cubic.Out(t)
        const ringRadius = this.radius * eased

        // Shockwave rings
        this.graphic.lineStyle(6 * (1 - t) + 1, 0xa855f7, 0.8 * (1 - t))
        this.graphic.strokeCircle(this.x, this.y, ringRadius)
        this.graphic.lineStyle(2, 0xe9d5ff, 0.9 * (1 - t))
        this.graphic.strokeCircle(this.x, this.y, ringRadius * 0.7)

        // Fireball core
        const coreRadius = this.radius * 0.55 * (1 - t)
        this.graphic.fillStyle(0x7c3aed, 0.5 * (1 - t))
        this.graphic.fillCircle(this.x, this.y, coreRadius)
        this.graphic.fillStyle(0xc084fc, 0.7 * (1 - t))
        this.graphic.fillCircle(this.x, this.y, coreRadius * 0.6)
        this.graphic.fillStyle(0xf3e8ff, 0.9 * (1 - t))
        this.graphic.fillCircle(this.x, this.y, coreRadius * 0.28)

        // Embers flying outwards
        const sparks = 10
        for (let i = 0; i < sparks; i++) {
            const angle = (Math.PI * 2 * i) / sparks + t * 1.5
            const distance = ringRadius * 0.8
            this.graphic.fillStyle(0xd8b4fe, 0.7 * (1 - t))
            this.graphic.fillCircle(this.x + Math.cos(angle) * distance, this.y + Math.sin(angle) * distance, 3 * (1 - t) + 1)
        }
    }

    private damageEnemies(): void {
        this.damaged = true

        for (const enemy of this.caster.getEnemyTeam().getChildren(true, true)) {
            if (!enemy.active || !enemy.canBeTargeted) continue
            if (Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) > this.radius) continue

            const { value, crit } = this.caster.calculateDamage(this.baseDamage)
            enemy.takeDamage(value, this.caster, "fire", crit, true, this.source)
        }
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
