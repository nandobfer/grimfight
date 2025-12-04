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
import { Lastwhisper } from "./completed/Lastwhisper"
import { Gargoylestoneplate } from "./completed/Gargoylestoneplate"
import { Crownguard } from "./completed/Crownguard"
import { Adaptivehelm } from "./completed/Adaptivehelm"
import { Evenshroud } from "./completed/Evenshroud"
import { Ionicspark } from "./completed/Ionicspark"
import { Protectorsvow } from "./completed/Protectorsvow"
import { Quicksilver } from "./completed/Quicksilver"
import { Steadfastheart } from "./completed/Steadfastheart"
import { Strikersflail } from "./completed/Strikersflail"
import { Sunfire } from "./completed/Sunfire"
import { Thiefsgloves } from "./completed/Thiefsgloves"
import { TrinityForce } from "./artifact/TrinityForce"
import { Dawncore } from "./artifact/Dawncore"
import { GoldCollector } from "./artifact/GoldCollector"
import { Hullcrusher } from "./artifact/Hullcrusher"
import { InnervatingLocket } from "./artifact/InnervatingLocket"
import { LichBane } from "./artifact/LichBane"
import { LudensTempest } from "./artifact/LudensTempest"
import { Manazane } from "./artifact/Manazane"
import { ProwlersClaw } from "./artifact/ProwlersClaw"
import { RapidFireCannon } from "./artifact/RapidFireCannon"
import { SeekersArmGuard } from "./artifact/SeekersArmGuard"
import { WitsEnd } from "./artifact/WitsEnd"
import { TalismanOfAscension } from "./artifact/TalismanOfAscension"
import { UnendingDespair } from "./artifact/UnendingDespair"
import { TitanicHydra } from "./artifact/TitanicHydra"
import { FlickerBlade } from "./artifact/FlickerBlade"
export interface Recipe {
    components: [string, string]
    result: string
}

// Create a character registry
export class ItemRegistry {
    private static componentRegistry: Map<string, new (scene: Game, texture: string, dataOnly?: boolean) => Item> = new Map()
    private static completedRegistry: Map<string, new (scene: Game, texture: string, dataOnly?: boolean) => Item> = new Map()
    private static artifactRegistry: Map<string, new (scene: Game, texture: string, dataOnly?: boolean) => Item> = new Map()
    private static registry: Map<string, new (scene: Game, texture: string, dataOnly?: boolean) => Item> = new Map()
    private static recipes: Recipe[] = []

    static registerArtifact(name: string, itemClass: new (scene: Game, texture: string) => Item) {
        this.artifactRegistry.set(name, itemClass)
        this.registry.set(name, itemClass)
    }
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

    static artifacts(): string[] {
        return Array.from(this.artifactRegistry.keys())
    }

    static randomComponent(scene: Game, exclude: string[] = [], dataOnly = false) {
        const name = RNG.pick(this.components().filter((item) => !exclude.includes(item)))
        return this.create(name, scene, dataOnly)
    }

    static randomCompleted(scene: Game, exclude: string[] = [], dataOnly = false) {
        const name = RNG.pick(this.completed().filter((item) => !exclude.includes(item)))
        return this.create(name, scene, dataOnly)
    }

    static randomArtifact(scene: Game, exclude: string[] = [], dataOnly = false) {
        const name = RNG.pick(this.artifacts().filter((item) => !exclude.includes(item)))
        return this.create(name, scene, dataOnly)
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

    static isArtifact(item: Item) {
        return this.artifactRegistry.has(item.key)
    }

    static getComponentRecipes(key: string) {
        return this.recipes.filter((recipe) => recipe.components.includes(key))
    }
}

// components
ItemRegistry.registerComponent("sword", Sword)
ItemRegistry.registerComponent("bow", Bow)
ItemRegistry.registerComponent("vest", Vest)
ItemRegistry.registerComponent("cloak", Cloak)
ItemRegistry.registerComponent("rod", Rod)
ItemRegistry.registerComponent("tear", Tear)
ItemRegistry.registerComponent("belt", Belt)
ItemRegistry.registerComponent("gloves", Gloves)

// completed items (curiosidade, a quantidade de itens completados = n * (n + 1) / 2 onde n = quantidade total de componentes)
// sword
ItemRegistry.registerCompleted("shojin", Shojin, ["sword", "tear"])
ItemRegistry.registerCompleted("deathblade", Deathblade, ["sword", "sword"])
ItemRegistry.registerCompleted("krakenslayer", Krakenslayer, ["sword", "bow"])
ItemRegistry.registerCompleted("nightedge", Nightedge, ["sword", "vest"])
ItemRegistry.registerCompleted("bloodthirster", Bloodthirster, ["sword", "cloak"])
ItemRegistry.registerCompleted("hextechgunblade", Hextechgunblade, ["sword", "rod"])
ItemRegistry.registerCompleted("sterak", Sterak, ["sword", "belt"])
ItemRegistry.registerCompleted("infinityedge", Infinityedge, ["sword", "gloves"])

// bow
ItemRegistry.registerCompleted("guinsoo", Guinsoo, ["bow", "bow"])
ItemRegistry.registerCompleted("titanresolve", Titanresolve, ["bow", "vest"])
ItemRegistry.registerCompleted("titanresolve", Titanresolve, ["bow", "cloak"])
ItemRegistry.registerCompleted("nashor", Nashor, ["bow", "rod"])
ItemRegistry.registerCompleted("voidstaff", Voidstaff, ["bow", "tear"])
ItemRegistry.registerCompleted("redbuff", Redbuff, ["bow", "belt"])
ItemRegistry.registerCompleted("lastwhisper", Lastwhisper, ["bow", "gloves"])

// rod
ItemRegistry.registerCompleted("rabadon", Rabadon, ["rod", "rod"])
ItemRegistry.registerCompleted("jeweledgauntlet", Jeweledgauntlet, ["rod", "gloves"])
ItemRegistry.registerCompleted("archangelstaff", Archangelstaff, ["rod", "tear"])
ItemRegistry.registerCompleted("morello", Morello, ["rod", "belt"])
ItemRegistry.registerCompleted("crownguard", Crownguard, ["rod", "vest"])
ItemRegistry.registerCompleted("ionicspark", Ionicspark, ["rod", "cloak"])

// tear
ItemRegistry.registerCompleted("bluebuff", Bluebuff, ["tear", "tear"])
ItemRegistry.registerCompleted("handofjustice", Handofjustice, ["tear", "gloves"])
ItemRegistry.registerCompleted("spiritvisage", Spiritvisage, ["tear", "belt"])
ItemRegistry.registerCompleted("adaptivehelm", Adaptivehelm, ["tear", "cloak"])
ItemRegistry.registerCompleted("protectorsvow", Protectorsvow, ["tear", "vest"])

// belt
ItemRegistry.registerCompleted("warmog", Warmog, ["belt", "belt"])
ItemRegistry.registerCompleted("evenshroud", Evenshroud, ["belt", "cloak"])
ItemRegistry.registerCompleted("strikersflail", Strikersflail, ["belt", "gloves"])
ItemRegistry.registerCompleted("sunfire", Sunfire, ["belt", "vest"])

// vest
ItemRegistry.registerCompleted("bramblevest", Bramblevest, ["vest", "vest"])
ItemRegistry.registerCompleted("gargoylestoneplate", Gargoylestoneplate, ["vest", "cloak"])
ItemRegistry.registerCompleted("steadfastheart", Steadfastheart, ["vest", "gloves"])

// cloak
ItemRegistry.registerCompleted("dragonclaw", Dragonclaw, ["cloak", "cloak"])
ItemRegistry.registerCompleted("quicksilver", Quicksilver, ["cloak", "gloves"])

// gloves
ItemRegistry.registerCompleted("thiefsgloves", Thiefsgloves, ["gloves", "gloves"])

// artifacts
ItemRegistry.registerArtifact("trinityforce", TrinityForce)
ItemRegistry.registerArtifact("dawncore", Dawncore)
ItemRegistry.registerArtifact("goldcollector", GoldCollector)
ItemRegistry.registerArtifact("hullcrusher", Hullcrusher)
ItemRegistry.registerArtifact("innervatinglocket", InnervatingLocket)
ItemRegistry.registerArtifact("lichbane", LichBane)
ItemRegistry.registerArtifact("ludenstempest", LudensTempest)
ItemRegistry.registerArtifact("manazane", Manazane)
ItemRegistry.registerArtifact("prowlersclaw", ProwlersClaw)
ItemRegistry.registerArtifact("rapidfirecannon", RapidFireCannon)
ItemRegistry.registerArtifact("seekersarmguard", SeekersArmGuard)
ItemRegistry.registerArtifact("witsend", WitsEnd)
ItemRegistry.registerArtifact("talismanofascension", TalismanOfAscension)
ItemRegistry.registerArtifact("unendingdespair", UnendingDespair)
ItemRegistry.registerArtifact("titanichydra", TitanicHydra)
ItemRegistry.registerArtifact("flickerblade", FlickerBlade)
