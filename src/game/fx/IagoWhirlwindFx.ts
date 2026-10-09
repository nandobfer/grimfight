import Phaser from "phaser"
import { Creature } from "../creature/Creature"
import { Game } from "../scenes/Game"

const WHIRLWIND_SPEED = 420
const WHIRLWIND_RADIUS = 26
const WHIRLWIND_MAX_DISTANCE = 2400

/**
 * Yasuo-style wind whirlwind, drawn entirely with Phaser Graphics. It travels in
 * a straight line in the caster's facing direction, damaging every enemy it
 * crosses once, and stops when it leaves the arena.
 */
export class IagoWhirlwindFx {
    private readonly scene: Game
    private readonly caster: Creature
    private readonly graphic: Phaser.GameObjects.Graphics
    private readonly source: string
    private readonly baseDamage: number
    private readonly angle: number

    private x: number
    private y: number
    private travelled = 0
    private spin = 0
    private readonly hit = new Set<Creature>()

    private light?: Phaser.GameObjects.Light
    private lightTween?: Phaser.Tweens.Tween
    private cleaned = false

    private readonly stop = () => this.cleanup()

    constructor(caster: Creature, angle: number, baseDamage: number, source: string) {
        this.caster = caster
        this.scene = caster.scene
        this.baseDamage = baseDamage
        this.source = source
        this.x = caster.x
        this.y = caster.y
        this.angle = angle

        const depth = (this.scene.grid.worldToCell(this.x, this.y)?.row ?? 0) + 2
        this.graphic = this.scene.add.graphics().setDepth(depth).setBlendMode(Phaser.BlendModes.ADD)
        this.scene.perRoundFx.add(this.graphic)

        if (this.scene.lights) {
            this.light = this.scene.lights.addLight(this.x, this.y, WHIRLWIND_RADIUS * 2, 0x9ad8ff, 2)
            this.lightTween = this.scene.tweens.add({
                targets: this.light,
                radius: { from: WHIRLWIND_RADIUS * 1.2, to: WHIRLWIND_RADIUS * 2.4 },
                intensity: { from: 2, to: 5 },
                duration: 400,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            })
        }

        this.scene.events.once("gamestate", this.stop)
        this.graphic.once("destroy", () => this.cleanup(false))
        this.scene.events.on("update", this.onUpdate)

        this.draw()
        this.damageEnemies()
    }

    private readonly onUpdate = (_time: number, delta: number): void => {
        if (this.cleaned) return

        const step = (WHIRLWIND_SPEED * delta) / 1000
        this.x += Math.cos(this.angle) * step
        this.y += Math.sin(this.angle) * step
        this.travelled += step
        this.spin += delta * 0.02

        if (this.light) this.light.setPosition(this.x, this.y)
        this.graphic.setDepth((this.scene.grid.worldToCell(this.x, this.y)?.row ?? 0) + 2)

        this.draw()
        this.damageEnemies()

        if (this.travelled >= WHIRLWIND_MAX_DISTANCE || this.scene.grid.worldToCell(this.x, this.y) === null) {
            this.cleanup()
        }
    }

    private draw(): void {
        const g = this.graphic
        g.clear()

        // Soft wind halo
        g.fillStyle(0xbfe0ff, 0.12)
        g.fillCircle(this.x, this.y, WHIRLWIND_RADIUS * 1.5)

        // Spinning spiral arms
        const arms = 3
        for (let i = 0; i < arms; i++) {
            const a0 = this.spin + (Math.PI * 2 * i) / arms

            g.lineStyle(3, 0xeaf6ff, 0.85)
            g.beginPath()
            g.arc(this.x, this.y, WHIRLWIND_RADIUS * 0.85, a0, a0 + Math.PI * 0.8, false)
            g.strokePath()

            g.lineStyle(2, 0xa8d8f5, 0.7)
            g.beginPath()
            g.arc(this.x, this.y, WHIRLWIND_RADIUS * 0.5, a0 + 0.6, a0 + 1.6, false)
            g.strokePath()
        }

        // Bright core
        g.fillStyle(0xf2fbff, 0.55)
        g.fillCircle(this.x, this.y, WHIRLWIND_RADIUS * 0.32)
    }

    private damageEnemies(): void {
        for (const enemy of this.caster.getEnemyTeam().getChildren(true, true)) {
            if (!enemy.active || !enemy.canBeTargeted) continue
            if (this.hit.has(enemy)) continue
            if (Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) > WHIRLWIND_RADIUS) continue

            this.hit.add(enemy)
            const { value, crit } = this.caster.calculateDamage(this.baseDamage)
            enemy.takeDamage(value, this.caster, "normal", crit, true, this.source)
        }
    }

    private cleanup(destroyGraphic = true): void {
        if (this.cleaned) return

        this.cleaned = true
        this.scene.events.off("gamestate", this.stop)
        this.scene.events.off("update", this.onUpdate)

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
