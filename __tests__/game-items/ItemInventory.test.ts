import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
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

        for (const heading of ["### ItemInventory", "### ItemInventoryLayout", "### Backpack UI", "### Persistence"]) {
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
        expect(itemSource).not.toContain("dropOnBoard")
        expect(itemSource).toContain("this.scene.availableItems.add(this)")
    })
})

describe("Game scene inventory wiring", () => {
    it("owns the backpack and bridges item drags from the UI", () => {
        const source = readSource(join(root, "src/game/scenes/Game.ts"))

        expect(source).toContain("inventory = new ItemInventory()")
        expect(source).toContain("get availableItems(): ItemInventory")
        expect(source).toContain("this.installItemDragBridge()")
        expect(source).toContain("EventBus.on(\"ui-item-drag-start\"")
        expect(source).toContain("EventBus.on(\"ui-item-drag-move\"")
        expect(source).toContain("EventBus.on(\"ui-item-drag-end\"")
        expect(source).toContain("equipItemFromWorld(")
        expect(source).toContain("availableItems: this.inventory.serialize()")
        expect(source).toContain("EventBus.off(\"ui-item-drag-end\"")
    })
})
