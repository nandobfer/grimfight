import { CreatureGroup } from "../../creature/CreatureGroup"
import { EventBus } from "../../tools/EventBus"
import { RNG } from "../../tools/RNG"
import { Item } from "../Items/Item"
import { ItemRegistry } from "../Items/ItemRegistry"
import { Augment } from "./Augment"

export class AnvilAugment extends Augment {
    constructor() {
        const name = "anvil"
        super(name)
        this.values.items = RNG.weightedPick([1, 1, 1, 2, 3])
        const value = this.values.items
        this.descriptionValues.items = { value: value, color: "warning.main" }
        const object = value === 1 ? "component" : value === 2 ? "completed item" : "special artifact"
        this.description = `Choose a ${object} from 5 random options.`
        this.color = "default"
    }

    override onPick(team: CreatureGroup): void {
        const items: Item[] = []

        const randomComponent = () =>
            ItemRegistry.randomComponent(
                team.scene,
                items.map((item) => item.key),
                true
            )

        const randomCompleted = () =>
            ItemRegistry.randomCompleted(
                team.scene,
                items.map((item) => item.key),
                true
            )

        const randomArtifact = () =>
            ItemRegistry.randomArtifact(
                team.scene,
                items.map((item) => item.key),
                true
            )

        const generateRandomItem = this.values.items === 1 ? randomComponent : this.values.items === 2 ? randomCompleted : randomArtifact

        for (let count = 1; count <= 5; count++) {
            const item = generateRandomItem()
            items.push(item)
        }
        EventBus.emit("choose-item-anvil", items)
    }
}
