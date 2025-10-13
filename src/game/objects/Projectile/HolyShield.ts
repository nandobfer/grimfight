// src/game/FireHit.ts
import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { Dot } from "../StatusEffect/Dot"
import { Projectile } from "./Projectile"

const animKey = "holy_shield"
const sprite = "holy_shield"

export class HolyShield extends Projectile {
    animKey = animKey
    speed = 350
    bounces = 3
    applyBurn = false
    destroyOnWallHit: boolean = true

    constructor(scene: Game, x: number, y: number, owner: Creature) {
        super(scene, x, y, owner, sprite, "holy")
        // this.toggleFlipY()
        this.setScale(0.85)
        this.initAnimation()
        this.setSize(this.width * 0.05, this.height * 0.05)
        this.addLightEffect({color: 0xfff176, intensity: 3, radius: 50})
        
    }

    override fire(target: Creature, startX?: number, startY?: number) {
        // Call parent fire method first
        super.fire(target, startX, startY)
        
        // Adjust rotation so the bottom of the shield points toward the enemy
        // Add 90 degrees (π/2 radians) to make the bottom edge the "head" of the projectile
        const currentRotation = this.rotation
        this.setRotation(currentRotation - Math.PI / 2)
        
        return this
    }

    initAnimation() {
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(sprite, { start: 3, end: 7 }),
                frameRate: 15,
                repeat: -1,
                yoyo: true,
            })
        }

        this.play(animKey)
    }

    onHit(target: Creature): void {
        const { value, crit } = this.owner.calculateDamage(this.owner.attackDamage * 0.5 + this.owner.abilityPower * 0.5)
        target.takeDamage(value, this.owner, "holy", crit, true, this.owner.abilityName)

        if (this.applyBurn) this.burn(target)

        this.bounces -= 1

        if (this.bounces > 0) {
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
                this.fire(nextTarget, target.x, target.y)
            }
        } else {
            this.destroy(true)
        }
    }

    getRemainingTargets() {
        const remainingEnemies = this.owner.getEnemyTeam().getChildren(true, true)

        if (remainingEnemies.every((enemy) => this.alreadyOverlaped.has(enemy))) {
            // this.alreadyOverlaped.clear()
            this.destroy()
        }

        return remainingEnemies
    }

    burn(target: Creature) {
        const duration = 5000
        const tickRate = 1000
        const ticks = duration / tickRate
        new Dot({
            abilityName: `${this.owner.abilityName} (burn)`,
            damageType: "fire",
            duration,
            target,
            tickRate,
            tickDamage: Math.round((this.owner.attackDamage * 0.5) / ticks),
            user: this.owner,
        }).start()
    }

}
