import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Archangelstaff extends Item {
    key = "archangelstaff"
    name = "Archangel's Staff"
    descriptionLines = ["+20% AP", "+3 mana/s", "Passive: Gains 5% AP every 5 seconds"]

    constructor(scene: Game) {
        super(scene, "item-archangelstaff")
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower += 0.2 * creature.baseAbilityPower
        creature.manaPerSecond += 0.2 * creature.baseManaPerSecond

        const previousHandler = creature.timeEvents[`archangelstaff_${this.id}`]
        if (previousHandler) {
            this.scene.time.removeEvent(previousHandler)
        }

        const buff = () => {
            if (this.scene.state === "fighting") {
                creature.abilityPower += creature.baseAbilityPower * 0.05
            }
        }

        creature.timeEvents[`archangelstaff_${this.id}`] = this.scene.time.addEvent({ callback: buff, loop: true, delay: 5000 })

        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.timeEvents[`archangelstaff_${this.id}`]
        if (handler) {
            this.scene.time.removeEvent(handler)
            delete creature.timeEvents[`archangelstaff_${this.id}`]
        }
    }
}
