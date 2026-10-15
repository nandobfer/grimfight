// src/game/systems/Items/InventoryDepths.ts
//
// Shared draw order for the backpack and the items it holds. Creature UI (health
// and resource bars) draws at `creature.depth + 10000`, so every layer touched by
// the inventory lives above that range: the bag panel is never covered by a bar.

/** Item equipped to a creature, drawn with the creature. */
export const ITEM_EQUIPPED_DEPTH = 1000
export const ITEM_EQUIPPED_BORDER_DEPTH = 1001

/** Bag icon fixed on the arena and its item counter. */
export const BAG_DEPTH = 20000
export const BAG_BADGE_DEPTH = 20001

/** Panel background, title, empty message and the invisible scroll surface. */
export const PANEL_BLOCKER_DEPTH = 20010
export const PANEL_DEPTH = 20011
export const PANEL_UI_DEPTH = 20012

/** Items shown inside a panel slot. */
export const ITEM_SLOT_DEPTH = 20020

/** Item being dragged, above the panel so it can leave the bag. */
export const ITEM_DRAG_DEPTH = 20040
export const ITEM_DRAG_BORDER_DEPTH = 20041

/** Transient copy of an item flying into the bag, above every other layer. */
export const ITEM_FLY_DEPTH = 20050
