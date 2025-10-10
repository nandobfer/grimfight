import { Creature } from "../../../creature/Creature"
import { DarkSlashFx } from "../../../fx/DarkSlashFx"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class TitanicHydra extends Item {
    key = "titanichydra"
    name = "Titanic Hydra"
    descriptionLines = ["+35% max health", "+35% AD", "Passive: Deals 3% of max health as bonus physical damage on hit to nearby enemies."]

    constructor(scene: Game) {
        super(scene, "item-titanichydra")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatPercent("maxHealth", 35)
        creature.addStatPercent("health", 35)
        creature.addStatPercent("attackDamage", 35)

        const previousHandler = creature.eventHandlers[`titanichydra_${this.id}`]
        if (previousHandler) {
            creature.off("afterAttack", previousHandler)
        }

        const afterAttack = (victim: Creature) => {
            const targets = victim.getAlliesInRange(64)
            targets.push(victim)

            for (const target of targets) {
                const { value, crit } = creature.calculateDamage(creature.maxHealth * 0.03)
                target.takeDamage(value, creature, "normal", crit, false, this.name)
                new DarkSlashFx(target)
            }
        }

        creature.eventHandlers[`titanichydra_${this.id}`] = afterAttack

        creature.on("afterAttack", afterAttack)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`titanichydra_${this.id}`]
        if (handler) {
            creature.off("afterAttack", handler)
            delete creature.eventHandlers[`titanichydra_${this.id}`]
        }
    }
}
