import { Arrow } from "../../objects/Arrow"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Archer extends Character {
    attackSpeed = 0.75
    speed = 40
    attackDamage = 30
    attackRange = 4

    constructor(scene: Game, x: number, y: number, id: string) {
        super(scene, x, y, "archer", id)
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
