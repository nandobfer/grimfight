import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Nightedge extends Item {
    key = "nightedge"
    name = "Lâmina da noite"
    descriptionLines = ["+15% AD", "+5% resistência", "Passiva: Ao ficar com 60% de vida pela primeira vez, fica inalvejável momentaneamente"]

    constructor(scene: Game) {
        super(scene, "item-nightedge")
    }

    override applyModifier(creature: Creature): void {
        creature.attackDamage *= 1 + 0.15
        creature.armor += 5

        const previousHandler = creature.eventHandlers.nightedge
        if (previousHandler) {
            creature.off("damage-taken", previousHandler)
        }

        const watchLife = (damage: number) => {
            if (creature.health / creature.maxHealth <= 0.6) {
                creature.removeFromEnemyTarget(3)
                const smokeParticles = this.scene.add.particles(creature.x, creature.y, "blood", {
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
                creature.off("damage-taken", watchLife)
            }
        }

        creature.eventHandlers.nightedge = watchLife

        creature.on("damage-taken", watchLife)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.nightedge
        if (handler) {
            creature.off("damage-taken", handler)
            delete creature.eventHandlers.nightedge
        }
    }
}
