import { Game } from "../../scenes/Game";
import { Monster } from "./Monster";

export class Demonic extends Monster {
    maxHealth = 300
    attackDamage = 50
    attackSpeed = 1

    constructor(scene: Game, x: number, y: number) {
        super(scene, x, y, "demonic")
        this.preferredPosition = 'middle'
        
    }
}