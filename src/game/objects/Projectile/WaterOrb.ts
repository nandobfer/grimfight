import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Projectile } from "./Projectile"

const waterOrbTextureKey = "rodolfo-water-orb"

export interface WaterOrbConfig {
    scale?: number
    /** When set, the orb deals this raw ability damage instead of a basic attack. */
    damage?: number
    splashDamage?: number
    splashRadius?: number
    source?: string
}

export class WaterOrb extends Projectile {
    override speed = 420
    override destroyOnWallHit = true

    private readonly config: WaterOrbConfig

    constructor(scene: Game, x: number, y: number, owner: Creature, config: WaterOrbConfig = {}) {
        WaterOrb.ensureTexture(scene)
        super(scene, x, y, owner, waterOrbTextureKey, "normal")

        this.config = config
        this.setScale(config.scale ?? 0.7)
        this.setCircle(6)
        this.addLightEffect({ color: 0x66ccff, intensity: 2.5, radius: 40, minIntensity: 1.2, maxIntensity: 4, duration: 400 })
    }

    override onHit(target: Creature): void {
        if (!target) {
            this.destroy()
            return
        }

        if (this.config.damage === undefined) {
            super.onHit(target)
            return
        }

        const source = this.config.source ?? this.owner.abilityName
        const { value, crit } = this.owner.calculateDamage(this.config.damage)
        target.takeDamage(value, this.owner, "normal", crit, true, source)

        this.applySplash(target, source)

        this.destroy()
    }

    private applySplash(origin: Creature, source: string): void {
        const radius = this.config.splashRadius ?? 0
        const splashDamage = this.config.splashDamage ?? 0
        if (radius <= 0 || splashDamage <= 0) return

        for (const enemy of this.owner.getEnemyTeam().getChildren(true, true)) {
            if (enemy === origin || !enemy.canBeTargeted) continue
            if (Phaser.Math.Distance.Between(origin.x, origin.y, enemy.x, enemy.y) > radius) continue

            const { value, crit } = this.owner.calculateDamage(splashDamage)
            enemy.takeDamage(value, this.owner, "normal", crit, true, source)
        }
    }

    private static ensureTexture(scene: Game): void {
        if (scene.textures.exists(waterOrbTextureKey)) return

        const graphic = scene.add.graphics()
        graphic.fillStyle(0x1f6fb2, 0.9)
        graphic.fillCircle(10, 10, 9)
        graphic.fillStyle(0x54b8ff, 0.95)
        graphic.fillCircle(10, 10, 6.5)
        graphic.fillStyle(0xdff4ff, 0.95)
        graphic.fillCircle(7, 7, 3)
        graphic.lineStyle(1.5, 0xbfe9ff, 0.9)
        graphic.strokeCircle(10, 10, 8)
        graphic.generateTexture(waterOrbTextureKey, 20, 20)
        graphic.destroy()
    }
}
