import Phaser from "phaser"
import { Creature } from "../creature/Creature"
import { Game } from "../scenes/Game"

type Opts = {
    offsetX?: number
    offsetY?: number
}

export type UiElementChildren = (Phaser.GameObjects.Graphics | Phaser.GameObjects.Text)

export class UiElement {
    scene: Game
    target: Creature
    offsetX: number
    offsetY: number
    elements: UiElementChildren[]

    constructor(target: Creature, opts: Opts = {}, elements: UiElementChildren[]) {
        this.scene = target.scene
        this.target = target

        this.offsetX = opts.offsetX ?? 0
        this.offsetY = opts.offsetY ?? 0
        this.elements = [...elements]

        this.setVisible(true)
        this.updatePosition()
    }

    updatePosition() {
        const x = this.target.x + this.offsetX
        const y = this.target.y + this.offsetY
        this.elements.forEach((item) => item.setPosition(x, y))
    }

    setDepth(d: number) {
        this.elements.forEach((item) => item.setDepth(item instanceof Phaser.GameObjects.Text ? d + 1 : d))
    }

    setVisible(v: boolean) {
        this.elements.forEach((item) => item.setVisible(v))
    }

    setAlpha(a: number) {
        this.elements.forEach((item) => item.setAlpha(a))
    }

    destroy() {
        this.elements.forEach((item) => item.destroy())
        // @ts-expect-error help GC
        this.target = undefined
    }

    fadeOut() {
        this.scene.tweens.add({
            targets: { a: 1 },
            a: 0,
            duration: 300,
            onUpdate: (tw, target: any) => {
                this.setAlpha(target.a)
            },
            onComplete: () => {
                this.setVisible(false)
            },
        })
    }

    reset() {
        this.setAlpha(1)
        this.setVisible(true)
    }
}
