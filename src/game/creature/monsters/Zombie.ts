import { Game } from "../../scenes/Game";
import { Monster } from "./Monster";

export class Zombie extends Monster {
    maxHealth = 750
    attackDamage = 30
    attackSpeed = 0.5

    constructor(scene: Game, x: number, y: number) {
        super(scene, x, y, "zombie")
        this.preferredPosition = "front"
        this.challengeRating = this.calculateCR()
    }
}