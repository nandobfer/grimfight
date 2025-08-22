import { Fireball } from "../../objects/Fireball"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Mage extends Character {
    baseAttackSpeed = 0.5
    baseAttackDamage = 50
    baseAttackRange = 3
    baseManaPerSecond = 20

    constructor(scene: Game, id: string) {
        super(scene, "mage", id)
        this.attackAnimationImpactFrame = 6
    }

    override extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking1", 1, 6)
        this.extractAnimationsFromSpritesheet("attacking2", 1, 6)
    }

    // levelUp(): void {
    //     super.levelUp()

    //     this.baseAttackDamage += 10
    // }

    override landAttack() {
        const fireball = new Fireball(this)
        fireball.fire()
    }
}
