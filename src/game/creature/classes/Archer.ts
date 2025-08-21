import { Arrow } from "../../objects/Arrow"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Archer extends Character {
    baseAttackSpeed = 0.75
    baseApeed = 40
    baseAttackDamage = 30
    baseAttackRange = 4

    constructor(scene: Game, id: string) {
        super(scene, "archer", id)
        this.attackAnimationImpactFrame = 9
    }

    extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking1", 208, 13)
        this.extractAnimationsFromSpritesheet("attacking2", 208, 13)
    }

    levelUp(): void {
        super.levelUp()

        this.attackDamage += 10
    }

    landAttack() {
        const arrow = new Arrow(this)
        arrow.fire()
    }
}
