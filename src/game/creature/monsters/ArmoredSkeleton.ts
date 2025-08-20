// src/game/characters/monsters/Skeleton.ts

import { Game } from "../../scenes/Game";
import { Monster } from "./Monster";

export class ArmoredSkeleton extends Monster {
    maxHealth = 500
    attackDamage = 30
    attackSpeed = 1
    armor = 10

    constructor(scene: Game, x: number, y: number) {
        super(scene, x, y, "armored_skeleton")
        this.preferredPosition = "front"
        this.challengeRating = this.calculateCR()
    }
}