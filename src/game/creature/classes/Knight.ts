import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Knight extends Character {
    baseMaxHealth = 750
    baseArmor = 5
    baseResistance = 10

    constructor(scene: Game, x: number, y: number, id: string) {
        super(scene, x, y, "knight", id)
    }

    levelUp(): void {
        super.levelUp()

        this.maxHealth += 50
    }
}
