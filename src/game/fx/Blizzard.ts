import { Creature } from "../creature/Creature"
import { Frozen } from "./Frozen"
import { FxSprite } from "./FxSprite"

export class Blizzard extends FxSprite {
    target: Creature
    caster: Creature
    baseDamage: number
    damagedEnemies = new Set<Creature>()
    duration = 2500
    damageInstances = 5

    constructor(caster: Creature, target: Creature, baseDamage: number, scaleFactor: number) {
        super(target.scene, target.x, target.y, "blizzard", scaleFactor)
        this.target = target
        this.caster = caster
        this.baseDamage = baseDamage
        // this.setSize(this.width * 0.2, this.height * 0.2) // Adjust size as needed
        // this.setOffset(this.width * 0.25, this.height * 0.25) // Center the hitbox

        this.addLightEffect({
            color: 0x66ddff,
            intensity: 1,
            radius: 500,
            duration: this.duration,
            minIntensity: 1,
            maxIntensity: 2,
            repeat: 0,
            yoyo: true,
        })

        this.scene.physics.add.overlap(this, this.target.team, (_explosion, enemyObj) => {
            const enemy = enemyObj as Creature
            if (this.damagedEnemies.has(enemy)) return

            this.damagedEnemies.add(enemy)
            this.startDamageChain(enemy)
        })

        this.anims.stop()
        this.anims.play({ key: "blizzard", frameRate: this.duration / (this.anims.getTotalFrames() * 2) / 100 })
    }

    startDamageChain(target: Creature) {
        this.dealDamage(target, this.damageInstances)
        this.freeze(target)
    }

    dealDamage(target: Creature, remaining: number) {
        if (remaining > 0 && target?.active) {
            remaining -= 1
            const { damage, crit } = this.caster.calculateDamage(this.baseDamage)
            console.log(`dealing ${damage} to ${target.name}`)
            target.takeDamage(damage, this.caster, "cold", crit)
            this.target?.scene?.time.delayedCall(this.duration / this.damageInstances, () => this.dealDamage(target, remaining))
        }
    }

    freeze(target: Creature) {
        // spawn ice

        const iceBlock = new Frozen(target)

        target.scene.tweens.add({
            targets: target,
            duration: Phaser.Math.FloatBetween(this.duration * 0.5, this.duration * 1.25),
            attackSpeed: 0,
            speed: 0,
            repeat: 0,
            manaPerSecond: 0,
            yoyo: true,
            onUpdate: () => {
                target.anims.stop()
                target.attacking = false
            },
            onComplete: () => {
                target.attacking = false
                iceBlock.destroy()
            },
        })
    }
}
