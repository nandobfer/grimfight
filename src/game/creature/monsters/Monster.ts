// src/game/characters/monsters/Monster.ts

import { Game } from "../../scenes/Game"
import { computeCR } from "../../tools/ChallengeRating"
import { Creature } from "../Creature"

export type PreferredPosition = "front" | "middle" | "back" // one of the 3 available rows. For enemies are the top 3, for player characters are the bottom 3

export class Monster extends Creature {
    preferredPosition: PreferredPosition = "front"
    challengeRating = 1
    boss = false

    private shadowParticles?: Phaser.GameObjects.Particles.ParticleEmitter
    private smokeParticles?: Phaser.GameObjects.Particles.ParticleEmitter
    private darkAura?: Phaser.FX.Glow

    constructor(scene: Game, texture: string) {
        super(scene, texture, Phaser.Utils.String.UUID())
    }

    calculateCR(): number {
        return computeCR(this, this.scene)
    }

    scaleStats(mult: number) {
        this.baseMaxHealth *= mult
        this.health = this.baseMaxHealth
        this.baseAttackDamage *= mult
        this.baseArmor *= mult * 0.5
        this.baseResistance *= mult * 0.25
        this.challengeRating = this.calculateCR()
        this.baseAttackSpeed = this.baseAttackSpeed * 0.75
    }

    scaleSize(mult: number) {
        this.setScale(this.scale * (1.1 + Math.log2(mult + 1) * 0.25))
    }

    makeBoss(targetCR: number) {
        const base = Math.max(0.1, this.calculateCR())
        const mult = Math.max(1, targetCR / base)
        this.scaleStats(mult)
        this.scaleSize(mult)
        this.boss = true
        // optional: glow/aura
        // const glow = this.postFX.addGlow(0xffd54f, 8, 0)
        // glow.outerStrength = 4

        // Add dark, smoky boss effects
        this.addDarkAura()
        this.addShadowParticles()
    }

    private addDarkAura() {
        // Deep purple/black aura with shimmer effect
        this.darkAura = this.postFX.addGlow(0x330033, 1, 0)
        this.darkAura.outerStrength = 6
        this.darkAura.innerStrength = 2

        // Pulsating shimmer effect
        this.scene.tweens.add({
            targets: this.darkAura,
            outerStrength: { from: 1, to: Math.min(2, this.challengeRating / 5) },
            innerStrength: { from: 1, to: Math.min(2, this.challengeRating / 5) },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        })
    }

    private addShadowParticles() {
        // Shadow wisps that emanate from the boss
        this.shadowParticles = this.scene.add.particles(this.x, this.y, "blood", {
            lifespan: { min: 1000, max: 2000 },
            speed: { min: 10, max: 30 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.6, end: 0 },
            quantity: 10,
            frequency: 100,
            blendMode: "MULTIPLY",
            tint: 0x000022,
        })

        this.shadowParticles.startFollow(this)
    }

    private addSmokeEffect() {
        // Dark smoke effect
        // ! preciso da sprite
        this.smokeParticles = this.scene.add.particles(this.x, this.y, "smoke", {
            lifespan: { min: 800, max: 1200 },
            speed: { min: 5, max: 15 },
            scale: { start: 0.4, end: 0.8 },
            alpha: { start: 0.3, end: 0 },
            quantity: 1,
            frequency: 200,
            blendMode: "SCREEN",
            tint: [0x222222, 0x444444, 0x666666],
            rotate: { min: -180, max: 180 },
        })

        this.smokeParticles.startFollow(this)

        // Occasional smoke bursts
        this.scene.time.addEvent({
            delay: 3000,
            callback: () => {
                if (this.smokeParticles && this.active) {
                    this.smokeParticles.explode(5)
                }
            },
            loop: true,
        })
    }

    clearFX() {
        super.clearFX()
        // Remove all existing FX
        if (this.darkAura) {
            this.postFX.remove(this.darkAura)
            this.darkAura = undefined
        }

        if (this.shadowParticles) {
            this.shadowParticles.stop()
            this.shadowParticles.destroy()
            this.shadowParticles = undefined
        }

        if (this.smokeParticles) {
            this.smokeParticles.stop()
            this.smokeParticles.destroy()
            this.smokeParticles = undefined
        }

        return this
    }

    updateFx() {
        if (this.shadowParticles && this.shadowParticles.active) {
            this.shadowParticles.setPosition(this.x, this.y)
        }
        if (this.smokeParticles && this.smokeParticles.active) {
            this.smokeParticles.setPosition(this.x, this.y)
        }
    }

    // Clean up effects when monster is destroyed
    override destroy(fromScene?: boolean): void {
        this.clearFX()
        super.destroy(fromScene)
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)

        this.updateFx()
    }
}
