import { FireEffect } from "../../fx/FireEffect"
import { Fireball } from "../../objects/Fireball"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Banguela extends Character {
    baseAttackSpeed = 1
    baseAttackRange = 3
    baseManaPerSecond = 10
    baseMaxMana = 125
    baseMaxHealth = 400
    baseAbilityPower: number = 30
    baseAttackDamage: number = 25

    abilityName = "Salva de fogo"

    constructor(scene: Game, id: string) {
        super(scene, "banguela", id)
    }

    override getAbilityDescription(): string {
        return `Lança [info.main:${Math.floor(this.abilityPower / 10)} (10% AP)] bolas de fogo no alvo, cada uma [error.main:${
            this.attackDamage * 1.5
        } (150% AD)] de dano.`
    }

    override getAttackingAnimation(): string {
        return `attacking`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 6
        this.extractAnimationsFromSpritesheet("attacking", 1, 6)
        this.extractAnimationsFromSpritesheet("casting", 208, 13)
    }

    override landAttack() {
        if (!this.target) return

        const fireball = new Fireball(this)
        fireball.fire(this.target)
    }

    override castAbility(multiplier = 1): void {
        this.casting = true

        const fireballsCount = Math.floor(this.abilityPower / 10)
        for (let count = 1; count <= fireballsCount; count++) {
            const { x, y } = this.randomPointAround()
            const fireball = new Fireball(this)
            const orb = new FireEffect(this.scene, x, y)
            orb.setScale(0.075)
            orb.setOrigin(0.5, 0.5)


            this.scene.perRoundFx.add(orb)
            this.scene.tweens.add({ targets: orb, duration: 45, angle: 360, repeat: -1, yoyo: false })

            fireball.onHit = (target) => {
                fireball.destroy(true)
                const { value, crit } = this.calculateDamage(this.attackDamage*1.5)
                target.takeDamage(value, this, "fire", crit)
            }

            this.scene.time.delayedCall(Phaser.Math.FloatBetween(200, 1200), () => {
                if (!this.target) return
                orb.destroy(true)
                fireball.fire(this.target, x, y)
            })
        }

        this.casting = false
    }
}
