import { Creature } from "../../../creature/Creature"
import { Game, GameState } from "../../../scenes/Game"
import { Item } from "../Item"

export class Protectorsvow extends Item {
    key = "protectorsvow"
    name = "Juramento do Protetor"
    descriptionLines = [
        "+10% resistência",
        "+20% mana/s",
        "Passiva: Ganha 20 de mana no início do combate",
        "Passiva: Ganha um escudo de 15% da vida no início do combate",
    ]

    constructor(scene: Game) {
        super(scene, "item-protectorsvow")
    }

    override applyModifier(creature: Creature): void {
        creature.manaPerSecond *= 1 + 0.2
        creature.resistance += 10

        const previousHandler = creature.eventHandlers.protectorsvow
        if (previousHandler) {
            this.scene.events.off("gamestate", previousHandler)
        }

        const onStart = (state: GameState) => {
            if (state === "fighting") {
                creature.gainShield(creature.maxHealth * 0.15)
                creature.gainMana(20)
            }
        }

        creature.eventHandlers.protectorsvow = onStart

        this.scene.events.on("gamestate", onStart)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.protectorsvow
        if (handler) {
            this.scene.events.off("gamestate", handler)
            delete creature.eventHandlers.protectorsvow
        }
    }
}
