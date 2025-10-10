import { Creature } from "../../../creature/Creature"
import { MagicCircleFx } from "../../../fx/MagicCircleFx"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class TalismanOfAscension extends Item {
    key = "talismanofascension"
    name = "Talisman Of Ascension"
    descriptionLines = [
        "+20% max health",
        "+20% AD",
        "+20% AP",
        "+20% attack speed",
        "+20% crit chance",
        "Passive: After 20 seconds in combat, triple this bonuses.",
    ]

    constructor(scene: Game) {
        super(scene, "item-talismanofascension")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatPercent("attackDamage", 20)
        creature.addStatPercent("abilityPower", 20)
        creature.addStatPercent("maxHealth", 20)
        creature.addStatPercent("health", 20)
        creature.addStatPercent("attackSpeed", 20)
        creature.addStatPercent("critChance", 20)

        const previousHandler = creature.timeEvents[`talismanofascension${this.id}`]
        if (previousHandler) {
            this.scene.time.removeEvent(previousHandler)
        }

        const buff = () => {
            if (this.scene.state === "fighting" && creature.active) {
                creature.addStatPercent("attackDamage", 40)
                creature.addStatPercent("abilityPower", 40)
                creature.addStatPercent("maxHealth", 40)
                creature.addStatPercent("health", 40)
                creature.addStatPercent("attackSpeed", 40)
                creature.addStatPercent("critChance", 40)
                creature.setScale(creature.scale * 1.5)
                new MagicCircleFx(this.scene, creature.x, creature.y)
            }
        }

        creature.timeEvents[`talismanofascension${this.id}`] = this.scene.time.addEvent({ callback: buff, delay: 20000 })

        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.timeEvents[`talismanofascension${this.id}`]
        if (handler) {
            this.scene.time.removeEvent(handler)
            delete creature.timeEvents[`talismanofascension${this.id}`]
        }
    }
}
