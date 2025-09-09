import { Game } from "../../scenes/Game"
import { RNG } from "../../tools/RNG"
import { Belt } from "./components/Belt"
import { Bow } from "./components/Bow"
import { Cloak } from "./components/Cloak"
import { Gloves } from "./components/Gloves"
import { Item } from "./Item"
import { Rod } from "./components/Rod"
import { Sword } from "./components/Sword"
import { Tear } from "./components/Tear"
import { Vest } from "./components/Vest"
import { Shojin } from "./completed/Shojin"
import { Deathblade } from "./completed/Deathblade"
import { Giantslayer } from "./completed/Giantslayer"
import { Nightedge } from "./completed/Nightedge"
import { Bloodthirster } from "./completed/Bloodthirster"
import { Hextechgunblade } from "./completed/Hextechgunblade"
import { Sterak } from "./completed/Sterak"
import { Infinityedge } from "./completed/Infinityedge"
import { Krakenslayer } from "./completed/Krakenslayer"
import { Redbuff } from "./completed/Redbuff"
import { Titanresolve } from "./completed/Titanresolve"
import { Guinsoo } from "./completed/Guinsoo"
import { Jeweledgauntlet } from "./completed/Jeweledgauntlet"
import { Dragonclaw } from "./completed/Dragonclaw"
import { Warmog } from "./completed/Warmog"
import { Spiritvisage } from "./completed/Spiritvisage"
import { Handofjustice } from "./completed/Handofjustice"
import { Morello } from "./completed/Morello"
import { Bluebuff } from "./completed/Bluebuff"
import { Archangelstaff } from "./completed/Archangelstaff"
import { Bramblevest } from "./completed/Bramblevest"
import { Rabadon } from "./completed/Rabadon"
import { Voidstaff } from "./completed/Voidstaff"
import { Nashor } from "./completed/Nashor"

export interface Recipe {
    components: [string, string]
    result: string
}

// Create a character registry
export class ItemRegistry {
    private static componentRegistry: Map<string, new (scene: Game, texture: string, dataOnly?: boolean) => Item> = new Map()
    private static completedRegistry: Map<string, new (scene: Game, texture: string, dataOnly?: boolean) => Item> = new Map()
    private static registry: Map<string, new (scene: Game, texture: string, dataOnly?: boolean) => Item> = new Map()
    private static recipes: Recipe[] = []

    static registerComponent(name: string, itemClass: new (scene: Game, texture: string) => Item) {
        this.componentRegistry.set(name, itemClass)
        this.registry.set(name, itemClass)
    }
    static registerCompleted(name: string, itemClass: new (scene: Game, texture: string) => Item, components: [string, string]) {
        this.completedRegistry.set(name, itemClass)
        this.registry.set(name, itemClass)

        this.recipes.push({ components: components.sort(), result: name })
    }

    static create(name: string, scene: Game, dataOnly?: boolean): Item {
        const ItemClass = this.registry.get(name)
        if (!ItemClass) {
            throw new Error(`Item class not found: ${name}`)
        }
        const item = new ItemClass(scene, name, dataOnly)
        return item
    }

    static entries(): string[] {
        return Array.from(this.registry.keys())
    }

    static components(): string[] {
        return Array.from(this.componentRegistry.keys())
    }

    static completed(): string[] {
        return Array.from(this.completedRegistry.keys())
    }

    static randomComponent(scene: Game) {
        const name = RNG.pick(this.components())
        return this.create(name, scene)
    }

    static randomCompleted(scene: Game) {
        const name = RNG.pick(this.completed())
        return this.create(name, scene)
    }

    static merge(scene: Game, items: [Item, Item], dataOnly?: boolean) {
        const result = this.getCombinationResult(items)
        if (result) {
            return this.create(result, scene, dataOnly)
        }
    }

    static getCombinationResult(items: [Item, Item]): string | null {
        const components = [items[0].key, items[1].key].sort() as [string, string]
        const recipe = this.recipes.find((recive) => recive.components[0] === components[0] && recive.components[1] === components[1])
        return recipe ? recipe.result : null
    }

    static isComponent(item: Item) {
        return this.componentRegistry.has(item.key)
    }
}

ItemRegistry.registerComponent("sword", Sword)
ItemRegistry.registerComponent("bow", Bow)
ItemRegistry.registerComponent("vest", Vest)
ItemRegistry.registerComponent("cloak", Cloak)
ItemRegistry.registerComponent("rod", Rod)
ItemRegistry.registerComponent("tear", Tear)
ItemRegistry.registerComponent("belt", Belt)
ItemRegistry.registerComponent("gloves", Gloves)

ItemRegistry.registerCompleted("shojin", Shojin, ["sword", "tear"])
ItemRegistry.registerCompleted("deathblade", Deathblade, ["sword", "sword"])
ItemRegistry.registerCompleted("krakenslayer", Krakenslayer, ["sword", "bow"])
ItemRegistry.registerCompleted("nightedge", Nightedge, ["sword", "vest"])
ItemRegistry.registerCompleted("bloodthirster", Bloodthirster, ["sword", "cloak"])
ItemRegistry.registerCompleted("hextechgunblade", Hextechgunblade, ["sword", "rod"])
ItemRegistry.registerCompleted("sterak", Sterak, ["sword", "belt"])
ItemRegistry.registerCompleted("infinityedge", Infinityedge, ["sword", "gloves"])

ItemRegistry.registerCompleted("redbuff", Redbuff, ["bow", "bow"])
ItemRegistry.registerCompleted("titanresolve", Titanresolve, ["bow", "vest"])
ItemRegistry.registerCompleted("titanresolve", Titanresolve, ["bow", "cloak"])
ItemRegistry.registerCompleted("guinsoo", Guinsoo, ["bow", "rod"])
ItemRegistry.registerCompleted("voidstaff", Voidstaff, ["bow", "tear"])
ItemRegistry.registerCompleted("nashor", Nashor, ["bow", "belt"])

ItemRegistry.registerCompleted("rabadon", Rabadon, ["rod", "rod"])
ItemRegistry.registerCompleted("jeweledgauntlet", Jeweledgauntlet, ["gloves", "rod"])
ItemRegistry.registerCompleted("handofjustice", Handofjustice, ["gloves", "tear"])
ItemRegistry.registerCompleted("bluebuff", Bluebuff, ["tear", "tear"])
ItemRegistry.registerCompleted("archangelstaff", Archangelstaff, ["tear", "rod"])
ItemRegistry.registerCompleted("morello", Morello, ["rod", "belt"])

ItemRegistry.registerCompleted("dragonclaw", Dragonclaw, ["cloak", "cloak"])
ItemRegistry.registerCompleted("bramblevest", Bramblevest, ["vest", "vest"])
ItemRegistry.registerCompleted("warmog", Warmog, ["belt", "belt"])
ItemRegistry.registerCompleted("spiritvisage", Spiritvisage, ["belt", "tear"])
