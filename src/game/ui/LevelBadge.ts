import Phaser from "phaser"
import { Creature } from "../creature/Creature"
import { UiElement } from "./UiElement"

type Opts = {
    offsetX?: number
    offsetY?: number
    radius?: number
    bgColor?: number
    borderColor?: number
    textColor?: string
    fontSize?: number
}

export class LevelBadge extends UiElement {
    private circle: Phaser.GameObjects.Graphics
    private text: Phaser.GameObjects.Text
    private radius: number

    constructor(target: Creature, opts: Opts = {}) {
        const scene = target.scene
        const radius = opts.radius ?? 7
        const bg = opts.bgColor ?? 0xffd54f // golden
        const border = opts.borderColor ?? 0x6d4c41
        const color = opts.textColor ?? "#1b1b1b"
        const font = opts.fontSize ?? 10

        const circle = scene.add.graphics()
        circle.fillStyle(bg, 1).lineStyle(1, border, 1).fillCircle(0, 0, radius).strokeCircle(0, 0, radius)

        const text = scene.add
            .text(0, 0, "1", {
                fontFamily: "Arial, sans-serif",
                fontSize: `${font}px`,
                color,
            })
            .setOrigin(0.5, 0.58)
            .setShadow(1, 1, "#000", 2, true, true)

        super(target, opts, [text, circle])

        this.radius = radius
        this.text = text
        this.circle = circle
        this.setDepth(target.depth + 101)
    }

    setValue(level: number) {
        this.text.setText(String(level))
    }
}
