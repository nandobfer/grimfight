import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import {
    INVENTORY_CATEGORIES,
    emptyGroups,
    flattenGroups,
    groupByCategory,
    reorderWithinCategory,
    type InventoryLayoutEntry,
} from "../../src/game/systems/Items/ItemInventoryLayout"

const root = process.cwd()
const itemsDir = join(root, "src/game/systems/Items")
const bagPath = join(root, "src/game/ui/InventoryBag.ts")

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

describe("inventory layout grouping", () => {
    const entries: InventoryLayoutEntry[] = [
        { id: "a1", category: "artifact" },
        { id: "c1", category: "component" },
        { id: "a2", category: "artifact" },
        { id: "k1", category: "completed" },
    ]

    it("exposes the stable divider order", () => {
        expect(INVENTORY_CATEGORIES).toEqual(["artifact", "completed", "component"])
    })

    it("splits entries into their dividers preserving relative order", () => {
        const groups = groupByCategory(entries)

        expect(groups.artifact.map((entry) => entry.id)).toEqual(["a1", "a2"])
        expect(groups.completed.map((entry) => entry.id)).toEqual(["k1"])
        expect(groups.component.map((entry) => entry.id)).toEqual(["c1"])
    })

    it("starts every divider empty", () => {
        const groups = emptyGroups<InventoryLayoutEntry>()

        for (const category of INVENTORY_CATEGORIES) {
            expect(groups[category]).toEqual([])
        }
    })

    it("flattens the dividers back into a single list", () => {
        const flat = flattenGroups(groupByCategory(entries))

        expect(flat).toHaveLength(entries.length)
        expect(flat.every((entry) => entries.includes(entry))).toBe(true)
    })
})

describe("inventory layout reorder", () => {
    const entries: InventoryLayoutEntry[] = [
        { id: "a1", category: "artifact" },
        { id: "c1", category: "component" },
        { id: "a2", category: "artifact" },
        { id: "k1", category: "completed" },
        { id: "c2", category: "component" },
    ]

    const categoryOrder = (reordered: InventoryLayoutEntry[], category: InventoryLayoutEntry["category"]) =>
        groupByCategory(reordered)[category].map((entry) => entry.id)

    it("moves an item to the requested slot inside its category", () => {
        const reordered = reorderWithinCategory(entries, "a2", 0)

        expect(categoryOrder(reordered, "artifact")).toEqual(["a2", "a1"])
    })

    it("keeps the other dividers untouched", () => {
        const reordered = reorderWithinCategory(entries, "c1", 1)

        expect(categoryOrder(reordered, "component")).toEqual(["c2", "c1"])
        expect(categoryOrder(reordered, "completed")).toEqual(["k1"])
        expect(categoryOrder(reordered, "artifact")).toEqual(["a1", "a2"])
    })

    it("clamps a target past the end of the category", () => {
        const reordered = reorderWithinCategory(entries, "a1", 99)

        expect(categoryOrder(reordered, "artifact")).toEqual(["a2", "a1"])
    })

    it("clamps a negative target to the start of the category", () => {
        const reordered = reorderWithinCategory(entries, "c2", -5)

        expect(categoryOrder(reordered, "component")).toEqual(["c2", "c1"])
    })

    it("never changes categories or loses items", () => {
        const reordered = reorderWithinCategory(entries, "k1", 0)

        expect(reordered).toHaveLength(entries.length)
        expect(new Set(reordered.map((entry) => entry.id))).toEqual(new Set(entries.map((entry) => entry.id)))
    })

    it("returns the original order for an unknown id", () => {
        const reordered = reorderWithinCategory(entries, "missing", 0)

        expect(reordered.map((entry) => entry.id)).toEqual(entries.map((entry) => entry.id))
    })
})

describe("ItemInventory aicontext", () => {
    it("documents the inventory system without numeric balance values", () => {
        const context = readSource(join(root, "aicontext/game-inventory.md"))

        for (const heading of ["### ItemInventory", "### ItemInventoryLayout", "### InventoryBag", "### Persistence"]) {
            expect(context).toContain(heading)
        }

        expect(context).not.toMatch(/[0-9]/)
        expect(context).not.toContain("%")
    })
})

describe("ItemInventory contracts", () => {
    it("stays free of Phaser and Item runtime imports in the layout module", () => {
        const source = readSource(join(itemsDir, "ItemInventoryLayout.ts"))

        expect(source).not.toContain("phaser")
        expect(source).not.toContain("./Item\"")
    })

    it("owns held items and exposes a Set-like surface plus ordering", () => {
        const source = readSource(join(itemsDir, "ItemInventory.ts"))

        expect(source).toContain("export class ItemInventory")
        expect(source).toContain("implements Iterable<Item>")
        expect(source).toContain("add(item: Item): this")
        expect(source).toContain("item.store()")
        expect(source).toContain("delete(item: Item): boolean")
        expect(source).toContain("findById(id: string)")
        expect(source).toContain("reorder(id: string, targetIndex: number)")
        expect(source).toContain("serialize(): string[]")
        expect(source).toContain("EventBus.emit(\"inventory-change\"")
    })

    it("classifies items into the backpack dividers through the registry", () => {
        const source = readSource(join(itemsDir, "ItemRegistry.ts"))

        expect(source).toContain("static categoryOf(item: Item): InventoryCategory")
        expect(source).toContain("if (this.artifactRegistry.has(item.key)) return \"artifact\"")
        expect(source).toContain("if (this.componentRegistry.has(item.key)) return \"component\"")
        expect(source).toContain("return \"completed\"")
    })

    it("stores items in the backpack instead of dropping them on the board", () => {
        const itemSource = readSource(join(itemsDir, "Item.ts"))

        expect(itemSource).toContain("store()")
        expect(itemSource).toContain("showInSlot(")
        expect(itemSource).not.toContain("dropOnBoard")
        expect(itemSource).toContain("this.scene.availableItems.add(this)")
    })
})

describe("InventoryBag contracts", () => {
    it("renders the backpack with Phaser objects, not with the React overlay", () => {
        const source = readSource(bagPath)

        expect(source).toContain("export class InventoryBag")
        expect(source).toContain("Phaser.GameObjects.Container")
        expect(source).toContain("BAG_TEXTURE")
        expect(source).toContain("scene.input.setDraggable(this.bag)")
        expect(source).toContain("CATEGORY_LABELS")
        expect(source).toContain(".setInteractive({ useHandCursor: true })")
        expect(source).toContain("this.panel.add([")
        expect(source).toContain("Artefato")
        expect(source).toContain("Completo")
        expect(source).toContain("Componente")
        expect(source).not.toMatch(/from "react"/)
        expect(source).not.toContain("@mui/")
    })

    it("spawns on a random corner of the map and can be dragged", () => {
        const source = readSource(bagPath)

        expect(source).toContain("cornerSpawnPosition(")
        expect(source).toContain("clampToRegion(")
        expect(source).toContain("spawnRandom()")
        expect(source).toContain("this.bag.on(\"drag\"")
        expect(source).toContain("this.bag.on(\"dragend\"")
        expect(source).toContain("private handlePointerUp()")
        expect(source).toContain("if (!this.dragged) this.toggle()")
        expect(source).toContain("private shiftItems(dx: number, dy: number)")
    })

    it("keeps the panel under the items so slot sprites stay visible", () => {
        const source = readSource(bagPath)
        const panelDepth = Number(source.match(/const PANEL_DEPTH = (\d+)/)?.[1])
        const itemSource = readSource(join(itemsDir, "Item.ts"))
        const itemDepth = Number(itemSource.match(/setDepth\((\d+)\)/)?.[1])

        expect(Number.isFinite(panelDepth)).toBe(true)
        expect(panelDepth).toBeLessThan(itemDepth)
    })

    it("reorders only inside the matching divider and swallows drops on its area", () => {
        const source = readSource(bagPath)

        expect(source).toContain("blocksPoint(x: number, y: number)")
        expect(source).toContain("handleSlotDrop(item: Item, pointer: Phaser.Input.Pointer)")
        expect(source).toContain("if (target.category !== this.inventory.categoryOf(item)) return")
        expect(source).toContain("this.inventory.reorder(item.id, target.index)")
    })

    it("returns items to the backpack area when they are not equipped", () => {
        const itemSource = readSource(join(itemsDir, "Item.ts"))

        expect(itemSource).toContain("this.scene.inventoryBag?.handleSlotDrop(this, pointer)")
        expect(itemSource).toContain("this.scene.inventoryBag?.blocksPoint(pointer.worldX, pointer.worldY)")
    })

    it("cleans up its listeners and objects", () => {
        const source = readSource(bagPath)

        expect(source).toContain("dispose()")
        expect(source).toContain("EventBus.off(\"inventory-change\"")
        expect(source).toContain("this.scene.input.off(\"pointerup\"")
        expect(source).toContain("this.bag.destroy()")
        expect(source).toContain("this.panel.destroy(true)")
    })

    it("no longer ships the React inventory module", () => {
        expect(existsSync(join(root, "src/ui/Inventory/Inventory.tsx"))).toBe(false)
        expect(existsSync(join(root, "src/ui/Inventory/useInventoryDrag.ts"))).toBe(false)

        const ui = readSource(join(root, "src/ui/Ui.tsx"))
        expect(ui).not.toContain("Inventory")
    })
})

describe("Game scene inventory wiring", () => {
    it("owns the backpack and bridges it through the scene", () => {
        const source = readSource(join(root, "src/game/scenes/Game.ts"))

        expect(source).toContain("inventory = new ItemInventory()")
        expect(source).toContain("inventoryBag?: InventoryBag")
        expect(source).toContain("get availableItems(): ItemInventory")
        expect(source).toContain("new InventoryBag(this, this.inventory, this.savedBagPosition)")
        expect(source).toContain("availableItems: this.inventory.serialize()")
        expect(source).toContain("bagPosition: this.inventoryBag?.getPosition()")
        expect(source).toContain("this.inventoryBag?.dispose()")
        expect(source).not.toContain("ui-item-drag")
        expect(source).not.toContain("installItemDragBridge")
    })

    it("closes the backpack when combat starts so items cannot be moved mid fight", () => {
        const source = readSource(join(root, "src/game/scenes/Game.ts"))

        expect(source).toContain("if (state === \"fighting\") {\n            this.inventoryBag?.close()\n        }")
    })

    it("loads the bag texture through the preloader", () => {
        const source = readSource(join(root, "src/game/scenes/Preloader.ts"))

        expect(source).toContain("this.load.svg(\"inventory-bag\", \"ui/backpack.svg\"")
        expect(existsSync(join(root, "public/assets/ui/backpack.svg"))).toBe(true)
    })
})

describe("Selling a character", () => {
    it("returns equipped items to the backpack before destroying the character", () => {
        const source = readSource(join(root, "src/game/creature/character/CharacterStore.ts"))
        const sell = source.slice(source.indexOf("sell(character: Character)"))

        expect(sell).toContain("character.unequipItem(item)")
        expect(sell).toContain("character.destroy(true)")
        expect(sell.indexOf("character.unequipItem(item)")).toBeLessThan(sell.indexOf("character.destroy(true)"))
        expect(sell).toContain("this.scene.saveProgress()")
    })
})
