// src/game/characters/monsters/Skeleton.ts

import { Game } from "../../scenes/Game";
import { Monster } from "./Monster";

export class Skeleton extends Monster {
    maxHealth = 50
    attackDamage = 10
    attackSpeed = 0.75

    constructor(scene: Game, x: number, y: number) {
        super(scene, x, y, "skeleton")
        this.preferredPosition = 'front'
        
    }
}