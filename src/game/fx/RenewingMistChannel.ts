import { Creature } from "../creature/Creature"
import { Game } from "../scenes/Game"

export class RenewingMistChannel extends Phaser.GameObjects.Graphics {
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
        const start = new Phaser.Math.Vector2(this.caster.x, this.caster.y - 18)
        const end = new Phaser.Math.Vector2(this.target.x, this.target.y - 18)
        const dx = end.x - start.x
        const dy = end.y - start.y
        const distance = Math.max(1, Math.hypot(dx, dy))
        const normalX = -dy / distance
        const normalY = dx / distance
        const pulse = (Math.sin(time * 0.009) + 1) * 0.5

        this.fillStyle(0x00ff88, 0.08 + pulse * 0.04)
        this.fillCircle(start.x, start.y, 16 + pulse * 4)
        this.fillStyle(0xb7ffd8, 0.1 + pulse * 0.06)
        this.fillCircle(end.x, end.y, 18 + pulse * 5)

        for (let i = 0; i < 6; i++) {
            const offset = (i - 2.5) * 8
            const drift = Math.sin(time * 0.012 + i * 1.73) * 12
            const controlX = (start.x + end.x) * 0.5 + normalX * (offset + drift)
            const controlY = (start.y + end.y) * 0.5 + normalY * (offset + drift) - 14 - pulse * 8
            const alpha = 0.08 + pulse * 0.04 + i * 0.012

            this.drawMistPath(start.x, start.y, controlX, controlY, end.x, end.y, 12, 0x00aa66, alpha * 0.45)
            this.drawMistPath(start.x, start.y, controlX, controlY, end.x, end.y, 6, 0x00ff88, alpha)
            this.drawMistPath(start.x, start.y, controlX, controlY, end.x, end.y, 2, 0xd8ffe8, Math.min(0.55, alpha + 0.12))
        }

        for (let i = 0; i < 16; i++) {
            const progress = (time * 0.00028 + i * 0.073) % 1
            const sway = Math.sin(time * 0.015 + i * 1.91) * 14
            const controlX = (start.x + end.x) * 0.5 + normalX * sway
            const controlY = (start.y + end.y) * 0.5 + normalY * sway - 18
            const point = this.getQuadraticPoint(start.x, start.y, controlX, controlY, end.x, end.y, progress)
            const shimmer = (Math.sin(time * 0.02 + i * 2.17) + 1) * 0.5
            const radius = 1.4 + shimmer * 1.8 + progress * 1.2
            const alpha = 0.18 + shimmer * 0.22 + progress * 0.16

            this.fillStyle(0x00ff88, alpha * 0.35)
            this.fillCircle(point.x, point.y, radius * 2.2)
            this.fillStyle(i % 3 === 0 ? 0xd8ffe8 : 0x74f7b2, alpha)
            this.fillCircle(point.x, point.y, radius)
        }
    }

    private drawMistPath(startX: number, startY: number, controlX: number, controlY: number, endX: number, endY: number, width: number, color: number, alpha: number): void {
        this.lineStyle(width, color, alpha)
        this.drawQuadraticPath(startX, startY, controlX, controlY, endX, endY, 12)
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
