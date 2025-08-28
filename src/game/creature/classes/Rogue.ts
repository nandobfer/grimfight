import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Rogue extends Character {
    baseAttackSpeed = 1.5
    baseSpeed = 130
    baseAttackDamage = 15
    baseCritChance = 20

    abilityName: string = "Passo sombrio"

    constructor(scene: Game, id: string) {
        super(scene, "mordred", id)
    }

    override getAbilityDescription(): string {
        return `Se teleporta para trás do alvo mais [primary.main:distante] e ataca imediatamente, causando [error.main:${Math.round(
            this.attackDamage * 4
        )} (400% AD)] de dano.`
    }

    override castAbility(): void {
        this.casting = true
        this.removeFromEnemyTarget()
        const target = this.getFartestEnemy()

        if (target) {
            this.target = target
            const direction = target.getOppositeDirection()
            const directionFactor = (target.avoidanceRange - 15) * (direction === "down" || direction === "right" ? 1 : -1)
            this.createTeleportSmoke()
            this.setPosition(target.x + directionFactor, target.y + directionFactor)
            const damage = this.calculateDamage(this.attackDamage * 4)
            target.takeDamage(damage.value, this, "normal", damage.crit)
            this.createTeleportSmoke()
        }

        // on animation complete, if any
        this.casting = false
    }

    // Add this method for teleport smoke effect
    private createTeleportSmoke(): void {
        const smokeParticles = this.scene.add.particles(this.x, this.y, "blood", {
            lifespan: { min: 300, max: 600 },
            speed: { min: 20, max: 60 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.8, end: 0 },
            quantity: 8,
            // blendMode: "NORMAL",
            tint: 0xfff,
            angle: { min: 0, max: 360 },
            gravityY: -20,
        })

        // Explode the particles (one-time burst)
        smokeParticles.explode(15)

        // Auto-destroy after particles finish
        this.scene.time.delayedCall(600, () => {
            smokeParticles.destroy()
        })
    }

    override reset(): void {
        super.reset()
        this.mana = this.maxMana * 0.9
    }
}
