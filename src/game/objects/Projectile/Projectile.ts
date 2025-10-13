// src/objects/Arrow.ts
import Phaser from "phaser"
import { Game } from "../../scenes/Game"
import { Creature } from "../../creature/Creature"
import { DamageType } from "../../ui/DamageNumbers"
import { EventBus } from "../../tools/EventBus"

export class Projectile extends Phaser.Physics.Arcade.Sprite {
    owner: Creature
    startX = 0
    startY = 0
    speed = 500
    damageType: DamageType
    light?: Phaser.GameObjects.Light

    declare scene: Game
    declare body: Phaser.Physics.Arcade.Body

    alreadyOverlaped = new Set<Creature>()
    private watchdog?: Phaser.Time.TimerEvent
    protected lightTween?: Phaser.Tweens.Tween
    protected colliders: Phaser.Physics.Arcade.Collider[] = []

    constructor(scene: Game, x: number, y: number, owner: Creature, texture: string, damageType: DamageType) {
        super(scene, x, y, texture)
        this.scene = scene
        this.scene?.add.existing(this)
        this.scene?.physics.add.existing(this)
        this.toggleFlipX()
        this.setScale(0.1, 0.1)

        this.damageType = damageType

        this.setActive(false).setVisible(false)
        this.setDepth(1000) // over characters
        this.setCircle(2) // small hit circle; tweak as needed
        this.body.allowGravity = false

        this.owner = owner
        this.setPipeline("Light2D")

        const wallCollider = this.scene?.physics.add.collider(this, this.scene?.walls, () => {
            this.onHitWall()
        })
        if (wallCollider) this.colliders.push(wallCollider)

        const enemyTeam = owner.getEnemyTeam()
        const overlapTeam = this.scene?.physics.add.overlap(this, enemyTeam, (_arrow, enemyObj) => {
            const enemy = enemyObj as Creature
            if (!enemy.active || !this.active) return
            if (this.alreadyOverlaped.has(enemy)) return

            this.alreadyOverlaped.add(enemy)

            this.onHit(enemy)
        })
        if (overlapTeam) this.colliders.push(overlapTeam)
        const overlapMinions = this.scene?.physics.add.overlap(this, enemyTeam.minions, (_arrow, enemyObj) => {
            const enemy = enemyObj as Creature
            if (!enemy.active || !this.active) return
            if (this.alreadyOverlaped.has(enemy)) return

            this.alreadyOverlaped.add(enemy)

            this.onHit(enemy)
        })
        if (overlapMinions) this.colliders.push(overlapMinions)

        EventBus.once("gamestate", () => {
            this.destroy()
        })
    }

    fire(target: Creature, startX?: number, startY?: number) {
        const from = this.owner

        // this.maxDistance = from.attackRange * 64 // keep consistent with range logic
        this.startX = startX || from.x
        this.startY = startY || from.y

        this.setPosition(this.startX, this.startY)
        this.setActive(true).setVisible(true)

        const angle = Phaser.Math.Angle.Between(this.startX, this.startY, target.x, target.y)
        this.setRotation(angle)

        this.scene?.physics.velocityFromRotation(angle, this.speed, this.body.velocity)

        // clean up if it travels too far
        this.watchdog = this.scene?.time.addEvent({
            delay: 16,
            loop: true,
            callback: () => {
                if (!this.active) {
                    this.destroy()
                }
            },
        })

        return this
    }

    onHit(target: Creature) {
        this.owner?.onAttackLand(this.damageType, target)
        this.owner?.onHit()
        this.destroy()
    }

    onHitWall() {
        this.scene?.onHitFx(this.damageType, this.x, this.y)
        this.setVelocity(0)
    }

    destroy(fromScene?: boolean): void {
        // clear timers/colliders/tweens to avoid leaking references
        if (this.watchdog) {
            this.watchdog.remove(false)
            this.watchdog = undefined
        }
        if (this.colliders.length) {
            for (const c of this.colliders) {
                try {
                    c.destroy()
                } catch {}
            }
            this.colliders.length = 0
        }
        if (this.lightTween) {
            this.lightTween.stop()
            this.scene?.tweens.remove(this.lightTween)
            this.lightTween = undefined
        }
        if (this.light) {
            const scene = this.owner?.scene || this.scene
            scene?.lights?.removeLight(this.light)
        }

        super.destroy(fromScene)
    }
}
