import { Creature } from "../creature/Creature"
import { FxSprite } from "./FxSprite"

export class Explosion extends FxSprite {
    target: Creature
    caster: Creature
    baseDamage: number
    damagedEnemies = new Set<Creature>()

    constructor(caster: Creature, target: Creature, baseDamage: number, scaleFactor: number) {
        super(target.scene, target.x, target.y, "explosion", scaleFactor)
        this.target = target
        this.caster = caster
        this.baseDamage = baseDamage
        this.setSize(this.width * 0.2, this.height * 0.2) // Adjust size as needed
        this.setOffset(this.width * 0.25, this.height * 0.25) // Center the hitbox

        this.addLightEffect({
            color: 0xff6600,
            intensity: 3,
            radius: 300,
            duration: 300,
            minIntensity: 1,
            maxIntensity: 10,
            maxRadius: 300,
            minRadius: 120,
            repeat: 0,
            yoyo: true,
        })

        this.scene.physics.add.overlap(this, this.target.team, (_explosion, enemyObj) => {
            const enemy = enemyObj as Creature
            if (this.damagedEnemies.has(enemy)) return

            const { damage, crit } = this.caster.calculateDamage(baseDamage)
            if (enemy.active) {
                console.log(`dealing ${damage} to ${enemy.name}`)
                enemy.takeDamage(damage, this.caster, { type: "fire", crit })
                this.damagedEnemies.add(enemy)
            }
        })
    }
}
