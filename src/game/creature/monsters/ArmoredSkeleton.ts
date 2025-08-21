// src/game/characters/monsters/Skeleton.ts

import { Game } from "../../scenes/Game";
import { Skeleton } from "./Skeleton"

export class ArmoredSkeleton extends Skeleton {
    baseMaxHealth = 500
    baseAttackDamage = 30
    baseAttackSpeed = 1
    baseArmor = 10

    constructor(scene: Game) {
        super(scene, "armored_skeleton")
        this.preferredPosition = "front"
        this.challengeRating = this.calculateCR()
    }
}