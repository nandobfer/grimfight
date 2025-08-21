import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Knight extends Character {
    baseMaxHealth = 750
    baseArmor = 5
    baseResistance = 10
    baseAttackDamage = 13

    constructor(scene: Game, id: string) {
        super(scene, "knight", id)
    }

    levelUp(): void {
        super.levelUp()

        this.maxHealth += 50
    }
}
