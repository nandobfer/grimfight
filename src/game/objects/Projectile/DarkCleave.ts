import Phaser from "phaser"
import type { Creature } from "../../creature/Creature"
import { calculateCloverDarkCleaveDamage, CLOVER_DARK_CLEAVE_SPEED, doesCloverDarkCleaveSegmentHit, getCloverWallContact, type CloverPoint, type CloverWallBounds } from "../../creature/classes/CloverDarkCleave"
import type { Game } from "../../scenes/Game"
import { Projectile } from "./Projectile"

const textureKey = "clover-dark-cleave"
const safetyLifetime = 10000

export class DarkCleave extends Projectile {
    override speed = CLOVER_DARK_CLEAVE_SPEED
    override destroyOnWallHit = true
    private previous: CloverPoint
    private readonly walls: CloverWallBounds[]
    private readonly multiplier: number
    private lifespan?: Phaser.Time.TimerEvent
    private readonly stopSlash = () => this.destroy()

    static preload(scene: Phaser.Scene): void {
        if (scene.textures.exists(textureKey)) return
        const graphic = scene.add.graphics()
        // A tapered crescent facing right, with a short translucent wake.
        const blade: Phaser.Types.Math.Vector2Like[] = []
        const samples = 20
        for (let i = 0; i <= samples; i++) {
            const t = i / samples
            blade.push({ x: 25 + Math.sin(t * Math.PI) * 20, y: 8 + t * 64 })
        }
        for (let i = samples; i >= 0; i--) {
            const t = i / samples
            blade.push({ x: 25 + Math.sin(t * Math.PI) * 7, y: 8 + t * 64 })
        }
        graphic.fillStyle(0x991b1b, 0.18)
        graphic.fillTriangle(4, 40, 33, 16, 33, 64)
        graphic.fillStyle(0x12060d, 0.95)
        graphic.fillPoints(blade, true)
        graphic.lineStyle(3, 0xb91c1c, 0.95)
        graphic.strokePoints(blade.slice(0, samples + 1), false)
        graphic.lineStyle(1, 0xff8b8b, 0.85)
        graphic.strokePoints(blade.slice(0, samples + 1), false)
        graphic.generateTexture(textureKey, 64, 80)
        graphic.destroy()
    }

    constructor(scene: Game, owner: Creature, origin: CloverPoint, angle: number, multiplier: number) {
        super(scene, origin.x, origin.y, owner, textureKey, "dark", { flipX: false })
        // Clip swept movement against walls before resolving enemy hits.
        for (const collider of this.colliders) collider.destroy()
        this.colliders.length = 0
        this.previous = { ...origin }
        this.multiplier = multiplier
        this.walls = scene.walls.getChildren().map((wall) => {
            const body = (wall as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody
            return { left: body.left, right: body.right, top: body.top, bottom: body.bottom }
        })
        this.setScale(1).setOrigin(35 / 64, 0.5).setRotation(angle)
        this.resetPipeline()
        this.setActive(true).setVisible(true)
        this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed)
        scene.perRoundFx.add(this)
        scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.sweep, this)
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.stopSlash)
        owner.once("died", this.stopSlash)
        owner.once("destroy", this.stopSlash)
        // Safety only: normal lifetime ends on the arena walls.
        this.lifespan = scene.time.delayedCall(safetyLifetime, this.stopSlash)
        this.sweep()
    }

    private sweep(): void {
        if (!this.active || this.scene.state !== "fighting" || !this.owner.active) {
            this.destroy()
            return
        }
        const end = { x: this.x, y: this.y }
        const cos = Math.abs(Math.cos(this.rotation))
        const sin = Math.abs(Math.sin(this.rotation))
        let contact = 1
        let hitWall = false
        for (const wall of this.walls) {
            const hit = getCloverWallContact(this.previous, end, wall, cos * 10 + sin * 32, sin * 10 + cos * 32)
            if (hit !== undefined && hit <= contact) {
                contact = hit
                hitWall = true
            }
        }
        end.x = this.previous.x + (end.x - this.previous.x) * contact
        end.y = this.previous.y + (end.y - this.previous.y) * contact
        const team = this.owner.getEnemyTeam()
        const check = (enemy: Creature) => {
            if (!this.active || !enemy.active || !enemy.canBeTargeted || this.alreadyOverlaped.has(enemy)) return
            const point = { x: enemy.x, y: enemy.y - 14 }
            if (!doesCloverDarkCleaveSegmentHit(point, this.previous, end)) return
            if (this.walls.some((wall) => getCloverWallContact(this.previous, point, wall) !== undefined)) return
            this.alreadyOverlaped.add(enemy)
            this.onHit(enemy)
        }
        for (const enemy of team.getChildren()) check(enemy)
        if (team.minions) for (const enemy of team.minions.getChildren()) check(enemy)
        this.previous.x = end.x
        this.previous.y = end.y
        if (hitWall && this.active) {
            this.setPosition(end.x, end.y)
            this.destroy()
        }
    }

    override onHit(target: Creature): void {
        const damage = this.owner.calculateDamage(calculateCloverDarkCleaveDamage(this.owner.attackDamage, this.multiplier))
        target.takeDamage(damage.value, this.owner, "dark", damage.crit, true, "Dark Cleave")
        this.owner.onHit(target)
    }

    override destroy(fromScene?: boolean): void {
        if (!this.scene) return
        this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.sweep, this)
        this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.stopSlash)
        this.owner.off("died", this.stopSlash)
        this.owner.off("destroy", this.stopSlash)
        this.lifespan?.remove(false)
        this.lifespan = undefined
        super.destroy(fromScene)
    }
}
