import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Rogue extends Character {
    attackSpeed = 1.5
    speed = 50
    attackDamage = 20
    critChance = 50

    constructor(scene: Game, x: number, y: number, id: string) {
        super(scene, x, y, "rogue", id)
    }

    levelUp(): void {
        super.levelUp()

        this.attackDamage += 5
    }
}