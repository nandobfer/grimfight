import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Projectile } from "./Projectile"

const snowballTextureKey = "snowball-projectile-hitbox"

export class Snowball extends Projectile {
    speed = 260
    destroyOnWallHit = true

    private graphic: Phaser.GameObjects.Graphics
    private visualRotation = 0

    private readonly updateVisual = (_time: number, delta: number) => {
        if (!this.active || !this.graphic.active) return

        this.visualRotation += delta * 0.012
        this.graphic.setPosition(this.x, this.y)
        this.graphic.setRotation(this.rotation + this.visualRotation)
    }

    constructor(scene: Game, x: number, y: number, owner: Creature) {
        Snowball.ensureTexture(scene)
        super(scene, x, y, owner, snowballTextureKey, "cold")

        this.setAlpha(0)
        this.setScale(1)
        this.setCircle(6)
        this.addLightEffect({ color: 0xaeefff, intensity: 2.5, radius: 36, minIntensity: 1.2, maxIntensity: 3.5, duration: 500 })

        this.graphic = scene.add.graphics().setDepth(this.depth + 1).setBlendMode(Phaser.BlendModes.ADD)
        this.drawSnowball()
        this.updateVisual(0, 0)

        scene.events.on("update", this.updateVisual)
        this.once("destroy", () => {
            scene.events.off("update", this.updateVisual)
            this.graphic.destroy(true)
        })
    }

    private static ensureTexture(scene: Game): void {
        if (scene.textures.exists(snowballTextureKey)) return

        const graphic = scene.add.graphics({ x: 0, y: 0 })
        graphic.fillStyle(0xffffff, 1)
        graphic.fillCircle(8, 8, 8)
        graphic.generateTexture(snowballTextureKey, 16, 16)
        graphic.destroy(true)
    }

    private drawSnowball(): void {
        this.graphic.clear()
        this.graphic.fillStyle(0x9fe8ff, 0.22)
        this.graphic.fillCircle(0, 0, 13)
        this.graphic.fillStyle(0xf4fdff, 0.96)
        this.graphic.fillCircle(0, 0, 8)
        this.graphic.fillStyle(0xffffff, 0.9)
        this.graphic.fillCircle(-3, -3, 3)
        this.graphic.fillStyle(0xc7efff, 0.75)
        this.graphic.fillCircle(4, 3, 2.5)
        this.graphic.lineStyle(1.6, 0x7ddcff, 0.9)
        this.graphic.lineBetween(-7, 1, 6, -3)
        this.graphic.lineBetween(-4, 6, 7, 2)
    }
}
