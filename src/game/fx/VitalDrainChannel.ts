import { Creature } from "../creature/Creature"
import { Game } from "../scenes/Game"

export class VitalDrainChannel extends Phaser.GameObjects.Graphics {
    declare scene: Game

    target: Creature
    private readonly caster: Creature
    private readonly updateFx: () => void

    constructor(target: Creature, caster: Creature) {
        super(caster.scene)

        this.target = target
        this.caster = caster
        this.updateFx = () => this.updateBeamPosition()

        this.scene.add.existing(this)
        this.setBlendMode(Phaser.BlendModes.ADD)
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.updateFx)
        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this)

        this.updateBeamPosition()
    }

    updateBeamPosition(): void {
        if (!this.active || !this.caster.active || !this.target.active) {
            this.destroy()
            return
        }

        this.clear()
        this.setDepth(Math.max(this.caster.depth, this.target.depth) + 8)

        const time = this.scene.time.now
        const start = new Phaser.Math.Vector2(this.target.x, this.target.y - 16)
        const end = new Phaser.Math.Vector2(this.caster.x, this.caster.y - 18)
        const dx = end.x - start.x
        const dy = end.y - start.y
        const distance = Math.max(1, Math.hypot(dx, dy))
        const normalX = -dy / distance
        const normalY = dx / distance
        const pulse = (Math.sin(time * 0.014) + 1) * 0.5

        this.fillStyle(0x2e1065, 0.18 + pulse * 0.08)
        this.fillCircle(start.x, start.y, 18 + pulse * 5)
        this.lineStyle(2, 0x1e3a8a, 0.28 + pulse * 0.18)
        this.strokeCircle(start.x, start.y, 12 + pulse * 4)
        this.fillStyle(0x4c1d95, 0.1 + pulse * 0.05)
        this.fillCircle(end.x, end.y, 12 + pulse * 3)

        for (let i = 0; i < 7; i++) {
            const offset = (i - 3) * 6
            const snap = Math.sin(time * 0.026 + i * 2.13) * 9
            const controlX = (start.x + end.x) * 0.5 + normalX * (offset + snap)
            const controlY = (start.y + end.y) * 0.5 + normalY * (offset + snap) - 10 - pulse * 5
            const alpha = 0.12 + pulse * 0.08 + i * 0.015

            this.drawDrainPath(start.x, start.y, controlX, controlY, end.x, end.y, 7, 0x1e1b4b, alpha * 0.5)
            this.drawDrainPath(start.x, start.y, controlX, controlY, end.x, end.y, 3, i % 2 === 0 ? 0x312e81 : 0x1e3a8a, alpha)
            this.drawDrainPath(start.x, start.y, controlX, controlY, end.x, end.y, 1.1, 0x7dd3fc, Math.min(0.65, alpha + 0.1))
        }

        for (let i = 0; i < 18; i++) {
            const progress = (time * 0.00048 + i * 0.061) % 1
            const tension = Math.sin(time * 0.018 + i * 1.67) * 11
            const controlX = (start.x + end.x) * 0.5 + normalX * tension
            const controlY = (start.y + end.y) * 0.5 + normalY * tension - 14
            const point = this.getQuadraticPoint(start.x, start.y, controlX, controlY, end.x, end.y, progress)
            const spark = (Math.sin(time * 0.032 + i * 2.41) + 1) * 0.5
            const radius = 1 + spark * 1.2 + progress * 0.8
            const alpha = 0.24 + progress * 0.38 + spark * 0.16

            this.fillStyle(0x1e1b4b, alpha * 0.45)
            this.fillCircle(point.x, point.y, radius * 2.1)
            this.fillStyle(i % 2 === 0 ? 0x3b0764 : 0x1e40af, alpha)
            this.fillCircle(point.x, point.y, radius)
            this.fillStyle(0x7dd3fc, Math.min(0.75, alpha + 0.08))
            this.fillCircle(point.x, point.y, Math.max(0.55, radius * 0.35))
        }
    }

    private drawDrainPath(startX: number, startY: number, controlX: number, controlY: number, endX: number, endY: number, width: number, color: number, alpha: number): void {
        this.lineStyle(width, color, alpha)
        this.drawQuadraticPath(startX, startY, controlX, controlY, endX, endY, 11)
    }

    private drawQuadraticPath(startX: number, startY: number, controlX: number, controlY: number, endX: number, endY: number, steps: number): void {
        this.beginPath()
        this.moveTo(startX, startY)
        for (let i = 1; i <= steps; i++) {
            const point = this.getQuadraticPoint(startX, startY, controlX, controlY, endX, endY, i / steps)
            this.lineTo(point.x, point.y)
        }
        this.strokePath()
    }

    private getQuadraticPoint(startX: number, startY: number, controlX: number, controlY: number, endX: number, endY: number, progress: number): { x: number; y: number } {
        const inverse = 1 - progress
        const inverseSquared = inverse * inverse
        const progressSquared = progress * progress

        return {
            x: inverseSquared * startX + 2 * inverse * progress * controlX + progressSquared * endX,
            y: inverseSquared * startY + 2 * inverse * progress * controlY + progressSquared * endY,
        }
    }

    override destroy(fromScene?: boolean): void {
        if (this.scene) {
            this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.updateFx)
            this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this)
        }

        super.destroy(fromScene)
    }
}
