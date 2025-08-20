// src/game/characters/monsters/Skeleton.ts

import { Game } from "../../scenes/Game";
import { Monster } from "./Monster";

export class Skeleton extends Monster {
    maxHealth = 350
    attackDamage = 15
    attackSpeed = 1

    constructor(scene: Game, x: number, y: number) {
        super(scene, x, y, "skeleton")
        this.preferredPosition = "middle"
        this.challengeRating = this.calculateCR()
    }
}