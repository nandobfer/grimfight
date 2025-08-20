// src/objects/Arrow.ts
import Phaser from "phaser"
import { Game } from "../scenes/Game"
import { Character } from "../characters/Character"

export class Projectile extends Phaser.Physics.Arcade.Image {
    owner: Character
    startX = 0
    startY = 0
    onHitEffect: string
    speed = 500

    declare scene: Game
    declare body: Phaser.Physics.Arcade.Body

    constructor(owner: Character, texture: string, onHitEffect: string) {
        super(owner.scene, owner.x, owner.y, texture)
        owner.scene.add.existing(this)
        owner.scene.physics.add.existing(this)
        this.toggleFlipX()
        this.setScale(0.1, 0.1)

        this.setActive(false).setVisible(false)
        this.setDepth(1000) // over characters
        this.setCircle(2) // small hit circle; tweak as needed
        this.body.allowGravity = false

        this.owner = owner
        this.onHitEffect = onHitEffect
        this.setPipeline("Light2D")
    }

    fire() {
        if (!this.owner.target) return
        const from = this.owner

        // this.maxDistance = from.attackRange * 64 // keep consistent with range logic
        this.startX = from.x
        this.startY = from.y

        this.setPosition(from.x, from.y)
        this.setActive(true).setVisible(true)

        const angle = Phaser.Math.Angle.Between(from.x, from.y, this.owner.target.x, this.owner.target.y)
        this.setRotation(angle)

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity)

        this.scene.physics.add.collider(this, this.scene.walls, () => {
            this.setVelocity(0)
        })

        // overlap with enemy team only
        const enemyTeam = this.scene.playerTeam.contains(from) ? this.scene.enemyTeam : this.scene.playerTeam
        this.scene.physics.add.overlap(this, enemyTeam, (_arrow, enemyObj) => {
            const enemy = enemyObj as Character
            if (!enemy.active) return

            this.owner.onAttack()

            this.destroy()
        })

        // clean up if it travels too far
        this.scene.time.addEvent({
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
}
