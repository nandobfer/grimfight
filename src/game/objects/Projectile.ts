// src/objects/Arrow.ts
import Phaser from "phaser"
import { Game } from "../scenes/Game"
import { Creature } from "../creature/Creature"
import { DamageType } from "../ui/DamageNumbers"
import { EventBus } from "../tools/EventBus"

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

    constructor(owner: Creature, texture: string, damageType: DamageType) {
        super(owner.scene, owner.x, owner.y, texture)
        this.scene = owner.scene
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

        this.scene?.physics.add.collider(this, this.scene?.walls, () => {
            this.onHitWall()
        })

        const enemyTeam = this.scene?.playerTeam.contains(this.owner) ? this.scene?.enemyTeam : this.scene?.playerTeam
        this.scene?.physics.add.overlap(this, enemyTeam, (_arrow, enemyObj) => {
            const enemy = enemyObj as Creature
            if (!enemy.active) return
            if (this.alreadyOverlaped.has(enemy)) return

            this.alreadyOverlaped.add(enemy)

            this.onHit(enemy)
        })
        this.scene?.physics.add.overlap(this, enemyTeam.minions, (_arrow, enemyObj) => {
            const enemy = enemyObj as Creature
            if (!enemy.active) return
            if (this.alreadyOverlaped.has(enemy)) return

            this.alreadyOverlaped.add(enemy)

            this.onHit(enemy)
        })

        EventBus.on("gamestate", (state: string) => {
            this.destroy()
        })
    }

    fire(target: Creature,) {
        const from = this.owner

        // this.maxDistance = from.attackRange * 64 // keep consistent with range logic
        this.startX = from.x
        this.startY = from.y

        this.setPosition(from.x, from.y)
        this.setActive(true).setVisible(true)

        const angle = Phaser.Math.Angle.Between(from.x, from.y, target.x, target.y)
        this.setRotation(angle)

        this.scene?.physics.velocityFromRotation(angle, this.speed, this.body.velocity)

        // clean up if it travels too far
        this.scene?.time.addEvent({
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
        this.destroy()
    }

    onHitWall() {
        this.scene?.onHitFx(this.damageType, this.x, this.y)
        this.setVelocity(0)
    }

    destroy(fromScene?: boolean): void {
        if (this.light) {
            const scene = this.owner?.scene || this.scene
            scene?.lights?.removeLight(this.light)
        }

        super.destroy(fromScene)
    }
}
