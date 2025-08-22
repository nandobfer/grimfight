import { Arrow } from "../../objects/Arrow"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Archer extends Character {
    baseAttackSpeed = 0.75
    baseApeed = 80
    baseAttackDamage = 30
    baseAttackRange = 4
    baseMaxHealth = 200

    constructor(scene: Game, id: string) {
        super(scene, "archer", id)
        this.attackAnimationImpactFrame = 9
    }

    override extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking1", 208, 13)
        this.extractAnimationsFromSpritesheet("attacking2", 208, 13)
    }

    // levelUp(): void {
    //     super.levelUp()

    //     this.baseAttackDamage += 10
    // }

    override landAttack() {
        const arrow = new Arrow(this)
        arrow.fire()
    }
}
