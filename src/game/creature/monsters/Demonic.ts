import { Fireball } from "../../objects/Fireball"
import { Game } from "../../scenes/Game"
import { Monster } from "./Monster"

export class Demonic extends Monster {
    baseMaxHealth = 2000
    baseAttackDamage = 50
    baseAttackSpeed = 0.75
    baseAttackRange = 3

    constructor(scene: Game) {
        super(scene, "demonic")
        this.preferredPosition = "back"
        this.attackAnimationImpactFrame = 9
        this.challengeRating = this.calculateCR()
    }

    extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking1", 208, 13)
        this.extractAnimationsFromSpritesheet("attacking2", 208, 13)
    }

    landAttack() {
        const fireball = new Fireball(this)
        fireball.fire()
    }
}
