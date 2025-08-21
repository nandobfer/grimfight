import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Rogue extends Character {
    baseAttackSpeed = 1.5
    baseSpeed = 50
    baseAttackDamage = 20
    baseCritChance = 50

    constructor(scene: Game, id: string) {
        super(scene, "rogue", id)
    }

    levelUp(): void {
        super.levelUp()

        this.baseAttackDamage += 5
    }
}