import { Creature } from "../creature/Creature"
import { FxSprite } from "./FxSprite"

export class FrostStrike extends FxSprite {
    target: Creature
    caster: Creature
    baseDamage: number
    damagedEnemies = new Set<Creature>()
    frameRate: number = 10

    constructor(caster: Creature, target: Creature, baseDamage: number, scaleFactor: number) {
        super(target.scene, target.x, target.y, "ice_slash", scaleFactor)
        this.target = target
        this.caster = caster
        this.baseDamage = baseDamage

        this.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2))

        this.addLightEffect({
            color: 0x66ddff,
            intensity: 10,
            radius: 45,
            duration: 300,
        })

    this.colliders.push(
        this.scene.physics.add.overlap(this, this.target.team, (_explosion, enemyObj) => {
            const enemy = enemyObj as Creature
            if (this.damagedEnemies.has(enemy)) return

            const { value: damage, crit } = this.caster.calculateDamage(baseDamage)
            if (enemy.active) {
                enemy.takeDamage(damage, this.caster, "cold", crit, true, this.caster.abilityName)
                this.damagedEnemies.add(enemy)
            }
        })
    )
    this.colliders.push(
        this.scene.physics.add.overlap(this, this.target.team.minions, (_explosion, enemyObj) => {
            const enemy = enemyObj as Creature
            if (this.damagedEnemies.has(enemy)) return

            const { value: damage, crit } = this.caster.calculateDamage(baseDamage)
            if (enemy.active) {
                enemy.takeDamage(damage, this.caster, "cold", crit, true, this.caster.abilityName)
                this.damagedEnemies.add(enemy)
            }
        })
    )
    }
}
