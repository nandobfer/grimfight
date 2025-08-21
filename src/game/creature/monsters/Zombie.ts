import { Game } from "../../scenes/Game";
import { Monster } from "./Monster";

export class Zombie extends Monster {
    baseMaxHealth = 750
    baseAttackDamage = 30
    baseAttackSpeed = 0.5

    constructor(scene: Game) {
        super(scene, "zombie")
        this.preferredPosition = "front"
        this.challengeRating = this.calculateCR()
    }
}