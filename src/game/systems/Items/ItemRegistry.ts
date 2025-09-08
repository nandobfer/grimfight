import { Game } from "../../scenes/Game"
import { RNG } from "../../tools/RNG"
import { Belt } from "./Belt"
import { Bow } from "./Bow"
import { Cloak } from "./Cloak"
import { Gloves } from "./Gloves"
import { Item } from "./Item"
import { Rod } from "./Rod"
import { Sword } from "./Sword"
import { Tear } from "./Tear"
import { Vest } from "./Vest"

// Create a character registry
export class ItemRegistry {
    private static registry: Map<
        string,
        new (scene: Game, texture: string) => Item
    > = new Map()

    static register(name: string, itemClass: new (scene: Game, texture: string,) => Item) {
        this.registry.set(name, itemClass)
    }

    static create(name: string, scene: Game): Item {
        const ItemClass = this.registry.get(name)
        if (!ItemClass) {
            throw new Error(`Character class not found: ${name}`)
        }
        const item = new ItemClass(scene, name)
        return item
    }


    static entries(): string[] {
        return Array.from(this.registry.keys())
    }

    static randomName() {
        return RNG.pick(this.entries())
    }

    static random(scene: Game) {
        const name = this.randomName()
        const item = this.create(name, scene)
        return item
    }
}

ItemRegistry.register("sword", Sword)
ItemRegistry.register('bow', Bow)
ItemRegistry.register('vest', Vest)
ItemRegistry.register('cloak', Cloak)
ItemRegistry.register('rod', Rod)
ItemRegistry.register('tear', Tear)
ItemRegistry.register('belt', Belt)
ItemRegistry.register('gloves', Gloves)