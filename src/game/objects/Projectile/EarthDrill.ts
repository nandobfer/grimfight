import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Projectile } from "./Projectile"

const earthDrillTextureKey = "rodolfo-earth-drill"
const earthDrillLifetime = 4000

export class EarthDrill extends Projectile {
    override speed = 720
    override destroyOnWallHit = true

    private readonly baseDamage: number
    private readonly source: string
    private lifespan?: Phaser.Time.TimerEvent
    private readonly stopDrill = () => this.destroy()

    constructor(scene: Game, x: number, y: number, owner: Creature, baseDamage: number, source: string) {
        EarthDrill.ensureTexture(scene)
        super(scene, x, y, owner, earthDrillTextureKey, "normal", { flipX: false })

        this.baseDamage = baseDamage
        this.source = source
        this.setScale(1)
        this.setSize(52, 20)
        this.setOrigin(0.1, 0.5)
        this.addLightEffect({ color: 0xc98a3c, intensity: 2, radius: 40, minIntensity: 1, maxIntensity: 3, duration: 400 })

        scene.perRoundFx.add(this)
        this.lifespan = scene.time.delayedCall(earthDrillLifetime, this.stopDrill)
        owner.once("died", this.stopDrill)
        owner.once("destroy", this.stopDrill)
    }

    /** The drill pierces: it keeps travelling after each hit instead of despawning. */
    override onHit(target: Creature): void {
        if (!target.active) return

        const { value, crit } = this.owner.calculateDamage(this.baseDamage)
        target.takeDamage(value, this.owner, "normal", crit, true, this.source)
    }

    override destroy(fromScene?: boolean): void {
        if (!this.scene) return

        this.lifespan?.remove(false)
        this.lifespan = undefined
        this.owner?.off("died", this.stopDrill)
        this.owner?.off("destroy", this.stopDrill)

        super.destroy(fromScene)
    }

    private static ensureTexture(scene: Game): void {
        if (scene.textures.exists(earthDrillTextureKey)) return

        const graphic = scene.add.graphics()
        // Tapered drill cone pointing right (+x), rotated to the cast direction.
        graphic.fillStyle(0x8a5a2b, 1)
        graphic.fillTriangle(6, 2, 6, 30, 44, 16)
        graphic.fillStyle(0xb07a3c, 1)
        graphic.fillTriangle(6, 6, 6, 26, 40, 16)
        graphic.lineStyle(2, 0x5c3a17, 1)
        for (let i = 0; i < 4; i++) {
            const x = 10 + i * 7
            graphic.lineBetween(x, 6, x + 6, 26)
        }
        graphic.fillStyle(0x3c2412, 1)
        graphic.fillRect(0, 11, 8, 10)
        graphic.generateTexture(earthDrillTextureKey, 48, 32)
        graphic.destroy()
    }
}
