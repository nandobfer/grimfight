import Phaser from "phaser"
import { Creature } from "../creature/Creature"
import { Game } from "../scenes/Game"
import { SORITA_CRIT_FACE, soritaDicePips } from "../creature/classes/SoritaDice"

const popInMs = 180
const holdMs = 620
const fadeOutMs = 260
const cubeHalfWidth = 15
const cubeTopHeight = 8
const cubeBodyHeight = 17

/**
 * Loaded-dice cast feedback drawn entirely with Phaser Graphics: an isometric
 * cube with pips on its top face plus the rolled number shown beside it. The
 * critical face is highlighted in gold with a star.
 */
export class SoritaDiceFx {
    private readonly scene: Game
    private readonly caster: Creature
    private readonly container: Phaser.GameObjects.Container
    private readonly tweens: Phaser.Tweens.Tween[] = []
    private cleaned = false

    private readonly stop = () => this.cleanup()

    constructor(caster: Creature, value: number, x: number, y: number) {
        this.caster = caster
        this.scene = caster.scene

        const depth = (this.scene.grid.worldToCell(x, y)?.row ?? 0) + 2
        const highlight = value >= SORITA_CRIT_FACE

        const graphic = this.scene.add.graphics()
        this.drawCube(graphic, value, highlight)

        const number = this.scene.add.text(cubeHalfWidth + 8, -2, String(value), {
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "22px",
            fontStyle: "bold",
            color: highlight ? "#ffe9a8" : "#f4ecd8",
            stroke: "#3d1226",
            strokeThickness: 3,
        })
        number.setOrigin(0, 0.5)

        this.container = this.scene.add.container(x, y, [graphic, number]).setDepth(depth)
        this.container.setScale(0.2)
        this.container.setAlpha(0)
        this.scene.perRoundFx.add(this.container)

        this.scene.events.once("gamestate", this.stop)
        caster.once("destroy", this.stop)
        this.container.once("destroy", () => this.cleanup(false))

        const popIn = this.scene.tweens.add({
            targets: this.container,
            scale: 1,
            alpha: 1,
            duration: popInMs,
            ease: "Back.easeOut",
        })
        const fadeOut = this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            scale: 1.15,
            y: y - 10,
            delay: popInMs + holdMs,
            duration: fadeOutMs,
            ease: "Sine.easeIn",
            onComplete: () => this.cleanup(),
        })

        this.tweens.push(popIn, fadeOut)
    }

    private drawCube(graphic: Phaser.GameObjects.Graphics, value: number, highlight: boolean): void {
        const top = { x: 0, y: -cubeTopHeight }
        const right = { x: cubeHalfWidth, y: 0 }
        const bottom = { x: 0, y: cubeTopHeight }
        const left = { x: -cubeHalfWidth, y: 0 }

        const faceTop = highlight ? 0xfff0b0 : 0xf4ecd8
        const faceLeft = highlight ? 0xd8b24a : 0xd9cba6
        const faceRight = highlight ? 0xe8c45a : 0xefe3c4
        const stroke = highlight ? 0xffe9a8 : 0x8a7a52
        const pip = highlight ? 0x6b4216 : 0x3a2f1a

        graphic.lineStyle(1.5, stroke, 1)

        graphic.fillStyle(faceLeft, 1)
        this.traceFace(graphic, [left, bottom, { x: bottom.x, y: bottom.y + cubeBodyHeight }, { x: left.x, y: left.y + cubeBodyHeight }])

        graphic.fillStyle(faceRight, 1)
        this.traceFace(graphic, [right, bottom, { x: bottom.x, y: bottom.y + cubeBodyHeight }, { x: right.x, y: right.y + cubeBodyHeight }])

        graphic.fillStyle(faceTop, 1)
        this.traceFace(graphic, [top, right, bottom, left])

        // Pips are mapped from a unit square onto the top rhombus so they follow the isometric face.
        const edgeRight = { x: right.x - top.x, y: right.y - top.y }
        const edgeLeft = { x: left.x - top.x, y: left.y - top.y }
        graphic.fillStyle(pip, 1)
        for (const point of soritaDicePips(value)) {
            const u = (point.x + 1) / 2
            const v = (point.y + 1) / 2
            graphic.fillCircle(top.x + u * edgeRight.x + v * edgeLeft.x, top.y + u * edgeRight.y + v * edgeLeft.y, 2.1)
        }

        if (highlight) {
            this.drawStar(graphic, 0, -cubeTopHeight - cubeBodyHeight - 3, 5)
        }
    }

    private traceFace(graphic: Phaser.GameObjects.Graphics, points: Array<{ x: number; y: number }>): void {
        graphic.beginPath()
        graphic.moveTo(points[0].x, points[0].y)
        for (let index = 1; index < points.length; index++) {
            graphic.lineTo(points[index].x, points[index].y)
        }
        graphic.closePath()
        graphic.fillPath()
        graphic.strokePath()
    }

    private drawStar(graphic: Phaser.GameObjects.Graphics, cx: number, cy: number, radius: number): void {
        graphic.fillStyle(0xfff0b0, 0.95)
        graphic.beginPath()
        for (let index = 0; index < 8; index++) {
            const r = index % 2 === 0 ? radius : radius * 0.4
            const angle = (Math.PI / 4) * index - Math.PI / 2
            const px = cx + Math.cos(angle) * r
            const py = cy + Math.sin(angle) * r
            if (index === 0) graphic.moveTo(px, py)
            else graphic.lineTo(px, py)
        }
        graphic.closePath()
        graphic.fillPath()
    }

    private cleanup(destroyContainer = true): void {
        if (this.cleaned) return
        this.cleaned = true

        this.scene.events.off("gamestate", this.stop)
        this.caster.off("destroy", this.stop)

        for (const tween of this.tweens) {
            tween.stop()
            this.scene.tweens.remove(tween)
        }
        this.tweens.length = 0

        if (destroyContainer && this.container.active) {
            this.container.destroy(true)
        }
    }
}
