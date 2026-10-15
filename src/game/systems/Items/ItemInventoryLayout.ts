// src/game/systems/Items/ItemInventoryLayout.ts
//
// Pure, dependency-free layout helpers for the item inventory ("bolsa").
// This module must stay free of Phaser and of the Item class so it can be
// imported by Node/Vitest tests without booting the engine.

export type InventoryCategory = "artifact" | "completed" | "component"

/** Canonical display order of the inventory dividers. */
export const INVENTORY_CATEGORIES: readonly InventoryCategory[] = ["artifact", "completed", "component"]

export interface InventoryLayoutEntry {
    id: string
    category: InventoryCategory
}

export type InventoryGroups<T> = Record<InventoryCategory, T[]>

export function emptyGroups<T>(): InventoryGroups<T> {
    return {
        artifact: [],
        completed: [],
        component: [],
    }
}

/** Splits entries into the three inventory categories, preserving relative order. */
export function groupByCategory<T extends InventoryLayoutEntry>(entries: readonly T[]): InventoryGroups<T> {
    const groups = emptyGroups<T>()

    for (const entry of entries) {
        groups[entry.category].push(entry)
    }

    return groups
}

/** Concatenates the category groups back into a single ordered list. */
export function flattenGroups<T>(groups: InventoryGroups<T>): T[] {
    const flat: T[] = []

    for (const category of INVENTORY_CATEGORIES) {
        flat.push(...groups[category])
    }

    return flat
}

/**
 * Moves the entry identified by `id` to `targetIndex` **within its own category**.
 * Entries of other categories keep their relative position; an unknown `id`
 * or a target outside the category bounds is clamped to a valid slot.
 */
export function reorderWithinCategory<T extends InventoryLayoutEntry>(entries: readonly T[], id: string, targetIndex: number): T[] {
    const moving = entries.find((entry) => entry.id === id)
    if (!moving) return [...entries]

    const others = entries.filter((entry) => entry.id !== id)
    const categorySize = others.filter((entry) => entry.category === moving.category).length
    const clampedTarget = clamp(Math.trunc(targetIndex), 0, categorySize)

    const result: T[] = []
    let inserted = false
    let seenInCategory = 0

    for (const entry of others) {
        if (!inserted && entry.category === moving.category && seenInCategory === clampedTarget) {
            result.push(moving)
            inserted = true
        }

        result.push(entry)
        if (entry.category === moving.category) seenInCategory += 1
    }

    if (!inserted) result.push(moving)

    return result
}

function clamp(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return min
    return Math.max(min, Math.min(max, value))
}
