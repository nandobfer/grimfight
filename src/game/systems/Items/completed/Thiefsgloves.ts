import { Creature } from "../../../creature/Creature"
import { Game, GameState } from "../../../scenes/Game"
import { Item } from "../Item"
import { ItemRegistry } from "../ItemRegistry"

export class Thiefsgloves extends Item {
    key = "thiefsgloves"
    name = "Luvas do Ladrão"
    descriptionLines = [
        "+30% chance de crítico",
        "Passiva: Equipa 2 itens completos aleatórios a cada rodada.",
        "Restrição: Não pode ser equipado com outros itens que não tenham sido gerados a partir deste.",
    ]
    items = new Set<Item>()

    constructor(scene: Game) {
        super(scene, "item-thiefsgloves")
    }

    override applyModifier(creature: Creature): void {
        creature.critChance += 30

        const previousHandler = creature.eventHandlers.thiefsgloves
        if (previousHandler) {
            this.scene.events.off("gamestate", previousHandler)
        }

        const equipRandomItems = (state: GameState) => {
            if (state === "idle") {
                this.clearItems(creature)
            } else {
                this.equipRandomItem(creature)
                this.equipRandomItem(creature)
                creature.refreshStats()
            }
        }

        creature.eventHandlers.thiefsgloves = equipRandomItems

        this.scene.events.on("gamestate", equipRandomItems)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers.thiefsgloves
        if (handler) {
            this.scene.events.off("gamestate", handler)
            delete creature.eventHandlers.thiefsgloves
        }
        if (!creature.isRefreshing) this.clearItems(creature)
    }

    clearItems(creature: Creature) {
        for (const item of this.items) {
            creature.unequipItem(item, true)
            item.sprite.destroy(true)
        }
        this.items.clear()
        this.scene.time.delayedCall(100, () => {
            if (creature?.active && !creature.isRefreshing) creature.refreshStats()
        })
    }

    equipRandomItem(creature: Creature) {
        if (this.items.size === 2) return

        // excluindo luvas do ladrão
        const excludeList = ["thiefsgloves"]
        for (const item of this.items) {
            // excluindo item repetido
            excludeList.push(item.key)
        }

        const randomItem = ItemRegistry.randomCompleted(this.scene, excludeList)
        randomItem.removeDragHandlers()
        randomItem.snapToCreature(creature)
        this.items.add(randomItem)

        creature.equipItem(randomItem, true)
    }
}
