import { Fireball } from "../../objects/Projectile/Fireball"
import { Game } from "../../scenes/Game"
import { RNG } from "../../tools/RNG"
import { Monster } from "./Monster"

export class Demonic extends Monster {
    baseMaxHealth = 300
    baseAttackDamage = 50
    baseAttackSpeed = 0.75
    baseAttackRange = 3
    baseMaxMana = 150
    baseManaPerAttack = 0
    baseManaPerSecond = 20

    constructor(scene: Game) {
        super(scene, "demonic")
        this.preferredPosition = "back"
        this.attackAnimationImpactFrame = 9
        this.challengeRating = this.calculateCR()
    }

    override getAttackingAnimation(): string {
        return "attacking"
    }

    override extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking", 208, 13)
    }

    override landAttack(target = this.target) {
        if (!target || !this?.active) return

        const fireball = new Fireball(this.scene, this.x, this.y, this)
        fireball.fire(target)
    }

    override castAbility(): void {
        this.casting = true

        const targets = 5
        const enemies = this.scene.playerTeam.getChildren(true, true)

        for (let i = 1; i <= targets; i++) {
            this.scene.time.delayedCall(i * 200, () => {
                const target = RNG.pick(enemies)
                if (!target || !this?.active) return
                const fireball = new Fireball(this.scene, this.x, this.y, this)
                fireball.onHit = (target) => {
                    const { value, crit } = this.calculateDamage(this.abilityPower * 0.5)
                    target.takeDamage(value, this, "fire", crit)
                    fireball.destroy()
                }
                fireball.fire(target)
            })
        }

        this.casting = false
    }
}
