import { Creature } from "../../../creature/Creature"
import { Game, GameState } from "../../../scenes/Game"
import { Item } from "../Item"

export class Crownguard extends Item {
    key = "crownguard"
    name = "Coroa da guarda"
    descriptionLines = ["+15% AP", "+10% armadura", "Passiva: Inicia o combate com um escudo de 200% AP"]

    constructor(scene: Game) {
        super(scene, "item-crownguard")
    }

    override applyModifier(creature: Creature): void {
        creature.abilityPower *= 1 + 0.15
        creature.armor += 10

        const previousHandler = creature.eventHandlers.crownguard
        if (previousHandler) {
            this.scene.events.off("gamestate", previousHandler)
        }

        const shieldOnStart = (state: GameState) => {
            if (state === "fighting") {
                creature.gainShield(creature.abilityPower * 2)
            }
        }

        creature.eventHandlers.crownguard = shieldOnStart

        this.scene.events.on("gamestate", shieldOnStart)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.crownguard
        if (handler) {
            this.scene.events.off("gamestate", handler)
            delete creature.eventHandlers.crownguard
        }
    }
}
