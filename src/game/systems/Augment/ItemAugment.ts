import { CreatureGroup } from "../../creature/CreatureGroup"
import { RNG } from "../../tools/RNG"
import { Augment } from "./Augment"

export class ItemAugment extends Augment {
    constructor() {
        const name = "item"
        super(name)
        this.values.items = RNG.weightedPick([1, 1, 1, 1, 1, 2, 2])
        this.descriptionValues.items = { value: "floor", color: "warning.main" }
        this.description = `Ganha [items:${this.descriptionValues.items.value}] componentes aleatórios`
        this.color = "default"
    }

    override onPick(team: CreatureGroup): void {
        team.scene.spawnItems(this.values.items)
    }
}
