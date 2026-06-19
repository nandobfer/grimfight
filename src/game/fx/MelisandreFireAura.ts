import { Creature } from "../creature/Creature"
import { Game } from "../scenes/Game"

export class MelisandreFireAura {
    private readonly scene: Game
    private readonly target: Creature
    private readonly graphic: Phaser.GameObjects.Graphics

    constructor(target: Creature) {
        this.target = target
        this.scene = target.scene
        this.graphic = this.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD)
        this.scene.perRoundFx.add(this.graphic)
    }

    update(elapsedMs: number): void {
        if (!this.graphic.active) return

        const elapsed = elapsedMs / 1000
        const x = this.target.x
        const y = this.target.y - 18
        const scale = Math.max(0.75, Math.abs(this.target.scaleX || this.target.scale || 1))
        const pulse = Math.sin(elapsed * 12) * 0.5 + 0.5

        this.graphic.clear()
        this.graphic.setDepth(this.target.depth + 2)

        this.graphic.lineStyle(7 * scale, 0xff3300, 0.18 + pulse * 0.08)
        this.graphic.strokeEllipse(x, y, 48 * scale + pulse * 7, 78 * scale + pulse * 9)
        this.graphic.lineStyle(3 * scale, 0xffaa00, 0.35 + pulse * 0.16)
        this.graphic.strokeEllipse(x, y + 2, 34 * scale + pulse * 5, 62 * scale + pulse * 8)

        for (let i = 0; i < 9; i++) {
            const normalized = i / 8
            const side = normalized * 2 - 1
            const wave = Math.sin(elapsed * 16 + i * 1.9)
            const baseX = x + side * (22 + pulse * 3) * scale
            const baseY = y + 28 * scale - Math.abs(side) * 12 * scale
            const tipX = baseX + wave * 5 * scale - side * pulse * 4 * scale
            const tipY = y - (28 + (i % 3) * 8 + pulse * 8) * scale
            const width = (5 + (i % 2) * 2) * scale

            this.graphic.fillStyle(0xff3b00, 0.34)
            this.graphic.fillTriangle(baseX - width * 1.8, baseY, baseX + width * 1.8, baseY, tipX, tipY)
            this.graphic.fillStyle(0xffb000, 0.46)
            this.graphic.fillTriangle(baseX - width, baseY - 2 * scale, baseX + width, baseY - 2 * scale, tipX, tipY + 11 * scale)
            this.graphic.fillStyle(0xffff99, 0.32)
            this.graphic.fillTriangle(baseX - width * 0.45, baseY - 4 * scale, baseX + width * 0.45, baseY - 4 * scale, tipX, tipY + 20 * scale)
        }

        for (let i = 0; i < 10; i++) {
            const sparkProgress = (elapsed * 1.7 + i * 0.137) % 1
            const sparkX = x + Math.sin(i * 2.4 + elapsed * 7) * (10 + (i % 4) * 5) * scale
            const sparkY = y + 28 * scale - sparkProgress * 68 * scale
            const alpha = (1 - sparkProgress) * 0.7

            this.graphic.fillStyle(i % 2 === 0 ? 0xfff2a0 : 0xff7a00, alpha)
            this.graphic.fillCircle(sparkX, sparkY, (1.2 + (i % 3) * 0.35) * scale)
        }
    }

    destroy(): void {
        if (this.graphic.active) {
            this.graphic.destroy(true)
        }
    }
}
