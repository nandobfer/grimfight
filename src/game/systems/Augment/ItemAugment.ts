import { CreatureGroup } from "../../creature/CreatureGroup"
import { RNG } from "../../tools/RNG"
import { ItemRegistry } from "../Items/ItemRegistry"
import { Augment } from "./Augment"

export class ItemAugment extends Augment {
    constructor() {
        const name = "item"
        super(name)
        this.values.items = RNG.weightedPick([1, 1, 1, 2, 3, 5])
        const value = this.values.items
        this.descriptionValues.items = { value: value, color: "warning.main" }
        this.description = `Gains [items:${value === 3 ? 1 : value}] ${value === 3 ? "completed item" : "components"}`
        this.color = "default"
    }

    override onPick(team: CreatureGroup): void {
        if (this.values.items === 3) {
            team.scene.spawnItem(RNG.pick(ItemRegistry.completed()))
        } else if (this.values.items === 5) {
            team.scene.spawnItem(RNG.pick(ItemRegistry.artifacts()))
        } else {
            team.scene.spawnItems(this.values.items)
        }
    }
}
