import { Arrow } from "../../objects/Arrow"
import { Game } from "../../scenes/Game"
import { RangedCharacter } from "../RangedCharacter"

export class Archer extends RangedCharacter<Arrow> {
    attackSpeed = 0.75
    speed = 40
    attackDamage = 30
    attackRange = 4

    constructor(scene: Game, x: number, y: number, id: string) {
        super(scene, x, y, "archer", Arrow, id, 9)
    }

    extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking", 208, 13)
    }

    levelUp(): void {
        super.levelUp()

        this.attackDamage += 10
    }
}
