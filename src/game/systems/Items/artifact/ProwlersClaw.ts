import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class ProwlersClaw extends Item {
    key = "prowlersclaw"
    name = "Prowler's Claw"
    descriptionLines = [
        "+30% AD",
        "+35% crit damage multiplier",
        "Passive: After killing an enemy, dashes to the most injured enemy and attack once for 100% AD damage.",
    ]

    constructor(scene: Game) {
        super(scene, "item-prowlersclaw")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatValue("attackDamage", 30)
        creature.addStatValue("critDamageMultiplier", 0.35)

        const previousHandler = creature.eventHandlers[`prowlersclaw_${this.id}`]
        if (previousHandler) {
            creature.off("kill", previousHandler)
        }

        const onKill = (victim: Creature) => {
            const dashDuration = (to: { x: number; y: number }) => {
                const dist = Phaser.Math.Distance.Between(creature.x, creature.y, to.x, to.y)
                const pxPerSec = 500 // tune this “speed”
                return Phaser.Math.Clamp((dist / pxPerSec) * 1000, 90, 180)
            }

            creature.target = victim.team.getLowestHealth() || undefined
            if (!creature.target) return

            const position = creature.target.randomPointAround()
            this.scene.tweens.add({
                    targets: creature,
                    duration: dashDuration(position),
                    repeat: 0,
                    yoyo: false,
                    x: position.x,
                    y: position.y,
                    ease: "Expo.easeOut",
                    onComplete: () => {
                        creature.emit("move", creature, position.x, position.y)
                        const damage = creature.calculateDamage(creature.attackDamage)
                        creature.target?.takeDamage(damage.value, creature, "normal", damage.crit, true, this.name)
                        creature.onHit(creature.target)
                    },
                })
        }

        creature.eventHandlers[`prowlersclaw_${this.id}`] = onKill

        creature.on("kill", onKill)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`prowlersclaw_${this.id}`]
        if (handler) {
            creature.off("kill", handler)
            delete creature.eventHandlers[`prowlersclaw_${this.id}`]
        }
    }
}
