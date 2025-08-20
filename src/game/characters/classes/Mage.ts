import { Fireball } from "../../objects/Fireball"
import { Game } from "../../scenes/Game"
import { RangedCharacter } from "../RangedCharacter"

export class Mage extends RangedCharacter<Fireball> {
    attackSpeed = 0.5
    attackDamage = 50
    attackRange = 3
    manaPerSecond = 20

    constructor(scene: Game, x: number, y: number, id: string) {
        super(scene, x, y, "mage", Fireball, id, 6)
    }

    extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking", 1, 6)
    }

    levelUp(): void {
        super.levelUp()

        this.attackDamage += 10
    }
}
