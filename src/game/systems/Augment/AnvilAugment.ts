import { CreatureGroup } from "../../creature/CreatureGroup"
import { EventBus } from "../../tools/EventBus"
import { Item } from "../Items/Item"
import { ItemRegistry } from "../Items/ItemRegistry"
import { Augment } from "./Augment"

export class AnvilAugment extends Augment {
    constructor() {
        const name = "anvil"
        super(name)
        this.descriptionValues.items = { value: "", color: "warning.main" }
        this.description = `Escolha um componente entre 3 opções aleatórias.`
        this.color = "default"
    }

    override onPick(team: CreatureGroup): void {
        const items: Item[] = []
        for (let count = 1; count <= 3; count++) {
            const item = ItemRegistry.randomComponent(
                team.scene,
                items.map((item) => item.key),
                true
            )
            items.push(item)
        }
        EventBus.emit("choose-item-anvil", items)
    }
}
