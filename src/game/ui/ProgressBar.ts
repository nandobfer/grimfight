// src/ui/ProgressBar.ts
import Phaser from "phaser"
import { Creature } from "../creature/Creature"
import { UiElement } from "./UiElement"

export interface BarOptions {
    color: number
    offsetY: number
    interpolateColor?: boolean
}

export class ProgressBar extends UiElement {
    private bg: Phaser.GameObjects.Graphics
    private bar: Phaser.GameObjects.Graphics
    private shieldGfx: Phaser.GameObjects.Graphics // NEW
    private width: number
    private height: number
    private borderColor: number
    private borderWidth: number
    private bgColor: number
    private fillColor: number
    private interpolateColor: boolean
    private lastRatio = -1

    constructor(target: Creature, options: BarOptions) {
        const scene = target.scene

        const bg = scene.add.graphics({ x: 0, y: 0 }).setDepth(target.depth + 10000)
        const bar = scene.add.graphics({ x: 0, y: 0 }).setDepth(target.depth + 10001)
        const shield = scene.add.graphics({ x: 0, y: 0 }).setDepth(target.depth + 10002)
        super(target, options, [bg, bar, shield])
        this.bg = bg
        this.bar = bar
        this.shieldGfx = shield

        this.width = 40 * target.scale
        this.height = 4
        this.offsetX -= this.width / 2
        this.offsetY = options.offsetY * target.scale
        this.borderColor = 0x000000
        this.borderWidth = 1
        this.bgColor = 0x222222
        this.fillColor = options.color
        this.interpolateColor = !!options.interpolateColor
    }

    setValue(current: number, max: number): void {
        const ratio = Phaser.Math.Clamp(max > 0 ? current / max : 0, 0, 1)
        this.setVisible(this.target.active)

        if (ratio === this.lastRatio) return
        this.lastRatio = ratio

        let fillColor = this.fillColor

        if (this.interpolateColor) {
            // Color shift (green -> yellow -> red)
            const fill = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(0xe74c3c), // red
                Phaser.Display.Color.ValueToColor(this.fillColor), // green
                100,
                Math.floor(ratio * 100)
            )
            fillColor = Phaser.Display.Color.GetColor(fill.r, fill.g, fill.b)
        }

        // DO NOT redraw bg every time; only the fill:
        this.bar.clear()
        this.bar.fillStyle(fillColor, 1)
        this.bar.fillRect(0, 0, Math.max(0, Math.floor(this.width * ratio)), this.height)
    }

    redrawBg() {
        this.bg.clear()
        this.bg.lineStyle(this.borderWidth, this.borderColor, 1)
        this.bg.fillStyle(this.bgColor, 1)
        this.bg.fillRect(0, 0, this.width, this.height)
        this.bg.strokeRect(0, 0, this.width, this.height)
    }

    /**
     * Draws a white overlay representing `shield` HP.
     * It starts at the end of the current HP segment and fills rightward;
     * if the shield exceeds missing HP, it wraps backward over the filled part.
     */
    setShield(shield: number, current: number, max: number) {
        this.shieldGfx.clear()
        if (shield <= 0 || max <= 0) return

        const w = this.width
        const h = this.height

        const curRatio = Phaser.Math.Clamp(current / max, 0, 1)
        const curW = Math.floor(w * curRatio)

        // Total shield width in bar-space
        const shieldW = Math.floor(w * Phaser.Math.Clamp(shield / max, 0, 1))

        // Space to the right until the end of the bar
        const rightSpace = w - curW
        const rightW = Math.min(shieldW, rightSpace)
        const backW = Math.max(0, shieldW - rightW)

        this.shieldGfx.fillStyle(0xffffff, 1)

        // 1) forward segment (from currentHP to the right)
        if (rightW > 0) {
            this.shieldGfx.fillRect(curW, 0, rightW, h)
        }

        // 2) backward segment (wrap) from left edge up to (curW - backW)
        if (backW > 0) {
            const startX = Math.max(0, curW - backW)
            const drawW = Math.min(backW, curW) // cap to available
            if (drawW > 0) {
                this.shieldGfx.fillRect(startX, 0, drawW, h)
            }
        }
    }
}
