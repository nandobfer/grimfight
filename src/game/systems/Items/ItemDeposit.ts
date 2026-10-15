// src/game/systems/Items/ItemDeposit.ts
//
// Visual context for an item entering the "bolsa" (backpack). Whoever transfers an
// item tells the backpack where it should fly from, or that it must be stored
// immediately. Keeping that decision in a value object avoids hidden state on the
// item and keeps every transfer site explicit and greppable.

import type { Item } from "./Item"

export interface ItemDeposit {
    /** World point the item should visually fly from. */
    from?: { x: number; y: number }
    /** `false` stores the item immediately, e.g. when the gesture already ended on the backpack. */
    animate?: boolean
}

/** Payload of the `inventory-deposit` event that drives the fly-to-backpack animation. */
export interface InventoryDeposit {
    item: Item
    from: { x: number; y: number }
}

/**
 * World point the item flies from, or `undefined` when it should land silently:
 * either there was never a visible spot for it, or the caller opted out.
 */
export function depositOrigin(deposit?: ItemDeposit): { x: number; y: number } | undefined {
    if (!deposit || deposit.animate === false) return undefined

    return deposit.from
}
