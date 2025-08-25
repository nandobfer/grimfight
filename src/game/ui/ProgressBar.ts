// src/ui/HealthBar.ts
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
    private width: number
    private height: number
    private borderColor: number
    private borderWidth: number
    private bgColor: number
    private fillColor: number
    private interpolateColor: boolean

    constructor(target: Creature, options: BarOptions) {
        const scene = target.scene

        const bg = scene.add.graphics({ x: 0, y: 0 }).setDepth(target.depth + 10000)
        const bar = scene.add.graphics({ x: 0, y: 0 }).setDepth(target.depth + 10001)
        super(target, options, [bg, bar])
        this.bg = bg
        this.bar = bar

        this.width = 30
        this.height = 4
        this.offsetX -= this.width / 2
        this.offsetY = options.offsetY
        this.borderColor = 0x000000
        this.borderWidth = 1
        this.bgColor = 0x222222
        this.fillColor = options.color
        this.interpolateColor = !!options.interpolateColor
    }

    setValue(current: number, max: number): void {
        const ratio = Phaser.Math.Clamp(max > 0 ? current / max : 0, 0, 1)
        this.setVisible(this.target.active)
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

        // Redraw
        this.bg.clear()
        this.bg.lineStyle(this.borderWidth, this.borderColor, 1)
        this.bg.fillStyle(this.bgColor, 1)
        this.bg.fillRect(0, 0, this.width, this.height)
        this.bg.strokeRect(0, 0, this.width, this.height)

        this.bar.clear()
        this.bar.fillStyle(fillColor, 1)
        this.bar.fillRect(0, 0, Math.max(0, Math.floor(this.width * ratio)), this.height)
    }
}
