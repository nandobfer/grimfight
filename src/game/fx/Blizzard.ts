import { Creature } from "../creature/Creature"
import { Condition } from "../objects/StatusEffect/Condition"
import { Dot } from "../objects/StatusEffect/Dot"
import { Freeze } from "../objects/StatusEffect/Freeze"
import { Frozen } from "./Frozen"
import { FxSprite } from "./FxSprite"

export class Blizzard extends FxSprite {
    target: Creature
    caster: Creature
    tickDamage: number
    damagedEnemies = new Set<Creature>()
    damageDuration = 0
    freezeDuration = 0
    damageInstances = 5

    constructor(caster: Creature, target: Creature, tickDamage: number, scaleFactor: number, damageDuration = 2500, freezeDuration = 1000) {
        super(target.scene, target.x, target.y, "blizzard", scaleFactor)
        this.target = target
        this.caster = caster
        this.tickDamage = tickDamage
        this.damageDuration = damageDuration
        this.freezeDuration = freezeDuration
        // this.setSize(this.width * 0.2, this.height * 0.2) // Adjust size as needed
        // this.setOffset(this.width * 0.25, this.height * 0.25) // Center the hitbox

        this.addLightEffect({
            color: 0x66ddff,
            intensity: 1,
            radius: 500,
            duration: this.damageDuration,
            minIntensity: 1,
            maxIntensity: 2,
            repeat: 0,
            yoyo: true,
        })

        this.scene.physics.add.overlap(this, this.target.team, (_explosion, enemyObj) => {
            const enemy = enemyObj as Creature
            if (this.damagedEnemies.has(enemy) || !enemy.active) return

            this.damagedEnemies.add(enemy)
            this.hit(enemy)
        })
        this.scene.physics.add.overlap(this, this.target.team.minions, (_explosion, enemyObj) => {
            const enemy = enemyObj as Creature
            if (this.damagedEnemies.has(enemy) || !enemy.active) return

            this.damagedEnemies.add(enemy)
            this.hit(enemy)
        })
    }

    override initAnimation() {
        if (!this.scene.anims.exists(this.sprite)) {
            this.scene.anims.create({
                key: this.sprite,
                frames: this.anims.generateFrameNumbers(this.sprite),
                frameRate: this.frameRate,
                repeat: -1,
            })
        }

        this.play(this.texture)
    }

    override onAnimationComplete(): void {}

    hit(target: Creature) {
        new Dot({
            damageType: "cold",
            duration: this.damageDuration,
            target: target,
            tickDamage: this.tickDamage,
            tickRate: 490,
            user: this.caster,
            onExpire: () => {
                if (!this.caster) return
                this.caster.finishChanneling()
                this.cleanup()
            },
            abilityName: this.caster.abilityName,
        }).start()

        new Freeze(target, this.caster, this.freezeDuration).start()
    }
}
