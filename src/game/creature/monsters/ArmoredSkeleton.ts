// src/game/characters/monsters/Skeleton.ts

import { MagicShieldFx } from "../../fx/MagicShieldFx"
import { Game } from "../../scenes/Game"
import { Skeleton } from "./Skeleton"

export class ArmoredSkeleton extends Skeleton {
    baseMaxHealth = 500
    baseAttackDamage = 30
    baseAttackSpeed = 1
    baseArmor: number = 50

    constructor(scene: Game) {
        super(scene, "armored_skeleton")
        this.preferredPosition = "front"
        this.challengeRating = this.calculateCR()
    }

    override castAbility(): void {
        this.casting = true

        new MagicShieldFx(this.scene, this.x, this.y, this.scale * 0.4)
        this.gainShield(this.abilityPower + this.maxHealth * 0.1)

        this.casting = false
    }
}