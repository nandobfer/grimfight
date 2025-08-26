// src/objects/Arrow.ts
import { Creature } from "../creature/Creature"
import { Projectile } from "./Projectile"

export class LightningBolt extends Projectile {
    speed = 1000
    bounces = 5

    rawDamage: number

    constructor(owner: Creature, rawDamage: number) {
        super(owner, "lightning_bolt", "lightning")
        this.setScale(0.35)
        this.setSize(this.width * 0.1, this.height * 0.1) // Adjust size as needed
        // this.setOffset(this.width * 0.25, this.height * 0.25) // Center the hitbox

        this.rawDamage = rawDamage
        this.addLightEffect()

        this.play("lightning_bolt")
    }

    private addLightEffect() {
        if (this.scene.lights) {
            this.light = this.scene.lights.addLight(this.x, this.y, 45, 0x2525ff, 10)

            this.scene.tweens.add({
                targets: this.light,
                radius: { from: 20, to: 50 },
                intensity: { from: 3, to: 20 },
                duration: 50,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            })

            this.scene.events.on("update", () => {
                if (this.active && this.light) {
                    this.light.setPosition(this.x, this.y)
                }
            })
        }
    }

    override onHit(target: Creature) {
        if (!target || !this.owner) {
            this.destroy()
            return
        }

        const { damage, crit } = this.owner.calculateDamage(this.rawDamage)
        target.takeDamage(damage, this.owner, this.damageType, crit)
        this.bounces -= 1
        this.rawDamage *= 0.75

        if (this.bounces === 0) {
            this.destroy()
        }

        let nextTarget: Creature | undefined = undefined
        let distanceToNextTarget = 0

        const remainingEnemies = this.getRemainingTargets()

        for (const creature of remainingEnemies) {
            if (creature === target || this.alreadyOverlaped.has(creature)) {
                continue
            }
            const distance = Phaser.Math.Distance.Between(this.x, this.y, creature.x, creature.y)

            if (!nextTarget) {
                nextTarget = creature
                distanceToNextTarget = distance
                continue
            }

            if (distance < distanceToNextTarget) {
                nextTarget = creature
                distanceToNextTarget = distance
            }
        }

        if (nextTarget) {
            this.nextFire(nextTarget, target)
        } else {
            this.destroy()
        }
    }

    getRemainingTargets() {
        const remainingEnemies = this.owner
            .getEnemyTeam()
            .getChildren(true)
            .filter((enemy) => enemy.active)

        if (remainingEnemies.every((enemy) => this.alreadyOverlaped.has(enemy))) {
            // this.alreadyOverlaped.clear()
            this.destroy()
        }

        return remainingEnemies
    }

    nextFire(target: Creature, from: Creature) {
        this.setPosition(from.x, from.y)
        const angle = Phaser.Math.Angle.Between(from.x, from.y, target.x, target.y )
        this.setRotation(angle)

        this.scene?.physics.velocityFromRotation(angle, this.speed, this.body.velocity)


        return this
    }

    override onHitWall() {
        super.onHitWall()
        this.destroy()
    }
}
