import { CreatureGroup } from "../../creature/CreatureGroup"
import { EventBus } from "../../tools/EventBus"
import { Item } from "../Items/Item"
import { ItemRegistry } from "../Items/ItemRegistry"
import { Augment } from "./Augment"

export class ArtifactAndCompletedAnvilAugment extends Augment {
    constructor() {
        const name = "anvil"
        super(name)
        this.description = `Choose a special artifact or completed item from 5 random options.`
        this.color = "default"
    }

    override onPick(team: CreatureGroup): void {
        const items: Item[] = []


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


        for (let count = 1; count <= 5; count++) {
            const item = count === 1 ? randomArtifact() : randomCompleted()
            items.push(item)
        }
        EventBus.emit("choose-item-anvil", items)
    }
}
