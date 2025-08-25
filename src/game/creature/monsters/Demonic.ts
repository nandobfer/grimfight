import { Fireball } from "../../objects/Fireball"
import { Game } from "../../scenes/Game"
import { RNG } from "../../tools/RNG"
import { Monster } from "./Monster"

export class Demonic extends Monster {
    baseMaxHealth = 2000
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

    override extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking1", 208, 13)
        this.extractAnimationsFromSpritesheet("attacking2", 208, 13)
    }

    override landAttack(target = this.target) {
        if (!target || !this.active) return

        const fireball = new Fireball(this)
        fireball.fire(target)
    }

    override castAbility(): void {
        this.casting = true

        const originalAttackDamage = this.attackDamage
        this.attackDamage = originalAttackDamage * 0.5
        const targets = 5
        const enemies = this.scene.playerTeam.getChildren().filter((item) => item.active)

        for (let i = 1; i <= targets; i++) {
            this.scene.time.delayedCall(i * 200, () => {
                const target = RNG.pick(enemies)
                this.landAttack(target)
            })
        }

        this.attackDamage = originalAttackDamage
        this.casting = false
    }
}
