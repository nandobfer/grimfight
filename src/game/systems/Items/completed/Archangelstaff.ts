import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class Archangelstaff extends Item {
    key = "archangelstaff"
    name = "Cajado do Arcanjo"
    descriptionLines = ["+20% AP", "+20% mana/s", "Passiva: Ganha 5% AP a cada 5 segundos"]

    constructor(scene: Game) {
        super(scene, "item-archangelstaff")
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower *= 1 + 0.2
        creature.manaPerSecond *= 1 + 0.2

        const previousHandler = creature.timeEvents.archangelstaff
        if (previousHandler) {
            this.scene.time.removeEvent(previousHandler)
        }

        const buff = () => {
            if (this.scene.state === 'fighting') {
                creature.abilityPower *= 1 + 0.05
            }
        }

        creature.timeEvents.archangelstaff = this.scene.time.addEvent({ callback: buff, loop: true, delay: 5000 })

        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.timeEvents.archangelstaff
        if (handler) {
            this.scene.time.removeEvent(handler)
            delete creature.timeEvents.archangelstaff
        }
    }
}
