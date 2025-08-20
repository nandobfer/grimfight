// src/game/characters/monsters/Monster.ts

import { Game } from "../../scenes/Game"
import { Character } from "../Character"

export type PreferredPosition = "front" | "middle" | "back" // one of the 3 available rows. For enemies are the top 3, for player characters are the bottom 3

export class Monster extends Character {
    preferredPosition: PreferredPosition = "front"
    challengeRating = 1
    isBoss = false

    constructor(scene: Game, x: number, y: number, texture: string) {
        super(scene, x, y, texture, Phaser.Utils.String.UUID())
        this.challengeRating = this.calculateCR()
        this.level = this.challengeRating
        console.log(this.challengeRating)
    }

    calculateCR(): number {
        // Simple linear model (tune as you add monsters)
        const dps = this.attackDamage * this.attackSpeed * (1 + (this.critChance / 100) * (this.critDamageMultiplier - 1))
        const rangeFactor = 1 + 0.2 * Math.max(0, this.attackRange - 1)
        const cr = this.maxHealth / 120 + (dps * rangeFactor) / 12 + this.armor / 40 + this.resistance / 80 + this.speed / 400
        return Math.max(0.1, cr)
    }

    scaleStats(mult: number) {
        this.maxHealth *= mult
        this.health = this.maxHealth
        this.attackDamage *= mult
        this.armor *= mult * 0.5
        this.resistance *= mult * 0.25
        this.challengeRating = this.calculateCR()
    }

    makeBoss(targetCR: number) {
        const base = Math.max(0.1, this.calculateCR())
        const mult = Math.max(1, targetCR / base)
        this.scaleStats(mult)
        this.setScale(this.scale * (1.1 + Math.log2(mult + 1) * 0.25))
        this.isBoss = true
        // optional: glow/aura
        const glow = this.postFX.addGlow(0xffd54f, 8, 0)
        glow.outerStrength = 4
    }
}
