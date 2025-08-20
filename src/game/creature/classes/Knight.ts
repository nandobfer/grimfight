import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Knight extends Character {
    maxHealth = 750
    armor = 5
    resistance = 10

    constructor(scene: Game, x: number, y: number, id: string) {
        super(scene, x, y, "knight", id)
    }

    levelUp(): void {
        super.levelUp()

        this.maxHealth += 50
    }
}
