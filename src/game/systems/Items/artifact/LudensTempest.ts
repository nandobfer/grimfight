import { Creature } from "../../../creature/Creature"
import { DarkSlashFx } from "../../../fx/DarkSlashFx"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class LudensTempest extends Item {
    key = "ludenstempest"
    name = "Ludens Tempest"
    descriptionLines = ["+30% AP", '+3 mana per second', "Passive: When cast, deal 100% AP as damage splitted your target and nearby enemies."]

    constructor(scene: Game) {
        super(scene, "item-ludenstempest")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatPercent("abilityPower", 30)
        creature.addStatValue("manaPerSecond", 3)

        const previousHandler = creature.eventHandlers[`ludenstempest_${this.id}`]
        if (previousHandler) {
            creature.off("cast", previousHandler)
        }

        const onCast = () => {
            const targets = creature.target?.getAlliesInRange(128) || []
            for (const target of targets) {
                const { value, crit } = creature.calculateDamage(creature.abilityPower / targets.length)
                target.takeDamage(value, creature, 'dark', crit, false, this.name)
                new DarkSlashFx(target)
            }
        }

        creature.eventHandlers[`ludenstempest_${this.id}`] = onCast

        creature.on("cast", onCast)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`ludenstempest_${this.id}`]
        if (handler) {
            creature.off("cast", handler)
            delete creature.eventHandlers[`ludenstempest_${this.id}`]
        }
    }
}
