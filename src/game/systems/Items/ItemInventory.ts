// src/game/systems/Items/ItemInventory.ts
//
// Runtime owner of the items the player is holding in the "bolsa" (backpack).
// It replaces the old `availableItems: Set<Item>` that scattered loose items
// across the arena: every held item is stored here with a hidden sprite and is
// surfaced to the UI through the `inventory-change` event.
//
// The class intentionally exposes a Set-like surface (`add`, `delete`, `clear`,
// `values`, `forEach`, iteration) so existing call sites keep working, and adds
// the ordering/grouping operations the backpack needs.

import { EventBus } from "../../tools/EventBus"
import type { Item } from "./Item"
import { ItemRegistry } from "./ItemRegistry"
import { emptyGroups, reorderWithinCategory, type InventoryCategory, type InventoryGroups } from "./ItemInventoryLayout"

export class ItemInventory implements Iterable<Item> {
    private items: Item[] = []

    get size(): number {
        return this.items.length
    }

    [Symbol.iterator](): Iterator<Item> {
        return this.items[Symbol.iterator]()
    }

    values(): IterableIterator<Item> {
        return this.items[Symbol.iterator]()
    }

    forEach(callback: (item: Item) => void): void {
        for (const item of this.items) callback(item)
    }

    has(item: Item): boolean {
        return this.items.includes(item)
    }

    findById(id: string): Item | undefined {
        return this.items.find((item) => item.id === id)
    }

    /** Adds the item to the backpack and hides its in-world sprite. Idempotent. */
    add(item: Item): this {
        if (!this.items.includes(item)) {
            this.items.push(item)
        }
        item.store()
        this.emit()
        return this
    }

    delete(item: Item): boolean {
        const index = this.items.indexOf(item)
        if (index === -1) return false

        this.items.splice(index, 1)
        this.emit()
        return true
    }

    clear(): void {
        this.items = []
        this.emit()
    }

    categoryOf(item: Item): InventoryCategory {
        return ItemRegistry.categoryOf(item)
    }

    /** Held items grouped by category, ready for the backpack UI. */
    snapshot(): InventoryGroups<Item> {
        return this.groupItems()
    }

    private groupItems(): InventoryGroups<Item> {
        const groups = emptyGroups<Item>()
        for (const item of this.items) {
            groups[this.categoryOf(item)].push(item)
        }
        return groups
    }

    /** Moves an item to `targetIndex` inside its own category. */
    reorder(id: string, targetIndex: number): void {
        const entries = this.items.map((item) => ({ id: item.id, category: this.categoryOf(item) }))
        const ordered = reorderWithinCategory(entries, id, targetIndex)
        const byId = new Map(this.items.map((item) => [item.id, item]))

        this.items = ordered.map((entry) => byId.get(entry.id) as Item)
        this.emit()
    }

    /**
     * Serializes the held items for persistence, preserving backpack order.
     * Temporary items (thief's gloves) are excluded from the permanent save.
     */
    serialize(): string[] {
        return this.items.filter((item) => !item.temporarySource).map((item) => item.key)
    }

    emit(): void {
        EventBus.emit("inventory-change", this.groupItems())
    }
}
