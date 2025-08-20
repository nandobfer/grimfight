import { Fireball } from "../../objects/Fireball"
import { Game } from "../../scenes/Game"
import { Monster } from "./Monster"

export class Demonic extends Monster {
    maxHealth = 2000
    attackDamage = 50
    attackSpeed = 0.75
    attackRange = 3

    constructor(scene: Game, x: number, y: number) {
        super(scene, x, y, "demonic")
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
