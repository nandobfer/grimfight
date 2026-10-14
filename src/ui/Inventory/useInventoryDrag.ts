import { useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent, RefObject, TouchEvent as ReactTouchEvent } from "react"
import { Item } from "../../game/systems/Items/Item"
import type { InventoryCategory } from "../../game/systems/Items/ItemInventoryLayout"
import { EventBus } from "../../game/tools/EventBus"

const SLOT_ATTRIBUTE = "data-inventory-slot"

interface UseInventoryDragOptions {
    panelRef: RefObject<HTMLElement | null>
    /** Whether a drag is currently allowed (only while the game is idle). */
    canDrag: () => boolean
    onReorder: (itemId: string, targetIndex: number) => void
}

interface DragState {
    itemId: string
    category: InventoryCategory
}

interface SlotTarget {
    category: InventoryCategory
    index: number
}

function slotTargetAt(clientX: number, clientY: number): SlotTarget | null {
    const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null
    const slot = element?.closest(`[${SLOT_ATTRIBUTE}]`) as HTMLElement | null
    if (!slot?.dataset.inventorySlot) return null

    const [category, index] = slot.dataset.inventorySlot.split(":")
    if (!category || index === undefined) return null

    return { category: category as InventoryCategory, index: Number(index) }
}

/**
 * Pointer-based bridge that lets items be dragged out of the React backpack and
 * dropped onto the Phaser board, or reordered inside the grid. It mirrors the
 * bench drag flow: the React side decides where the pointer ended (inside the
 * panel = reorder, outside = let the scene resolve the drop).
 */
export const useInventoryDrag = (options: UseInventoryDragOptions) => {
    const { panelRef, canDrag, onReorder } = options
    const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
    const ctrlRef = useRef<AbortController | null>(null)
    const dragRef = useRef<DragState | null>(null)

    useEffect(() => () => ctrlRef.current?.abort(), [])

    const isInsidePanel = (clientX: number, clientY: number) => {
        const element = panelRef.current
        if (!element) return false

        const rect = element.getBoundingClientRect()
        return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    }

    const startFromPoint = (item: Item, category: InventoryCategory, clientX: number, clientY: number) => {
        dragRef.current = { itemId: item.id, category }
        setDraggingItemId(item.id)
        EventBus.emit("ui-item-drag-start", { itemId: item.id, clientX, clientY })

        const ctrl = new AbortController()
        ctrlRef.current = ctrl
        const { signal } = ctrl

        const onPointerMove = (ev: PointerEvent) => EventBus.emit("ui-item-drag-move", { clientX: ev.clientX, clientY: ev.clientY })
        const onPointerUp = (ev: PointerEvent) => finish(ev.clientX, ev.clientY)

        const onTouchMove = (ev: TouchEvent) => {
            if (!ev.touches.length) return
            ev.preventDefault()
            const touch = ev.touches[0]
            EventBus.emit("ui-item-drag-move", { clientX: touch.clientX, clientY: touch.clientY })
        }
        const onTouchEnd = (ev: TouchEvent) => {
            const touch = ev.changedTouches[0]
            finish(touch.clientX, touch.clientY)
        }

        const finish = (endX: number, endY: number) => {
            ctrl.abort()
            ctrlRef.current = null

            const state = dragRef.current
            dragRef.current = null
            setDraggingItemId(null)
            if (!state) return

            const insidePanel = isInsidePanel(endX, endY)
            EventBus.emit("ui-item-drag-end", { clientX: endX, clientY: endY, dropped: !insidePanel })

            if (!insidePanel) return

            const target = slotTargetAt(endX, endY)
            if (target && target.category === state.category) {
                onReorder(state.itemId, target.index)
            }
        }

        window.addEventListener("pointermove", onPointerMove, { signal, passive: true })
        window.addEventListener("pointerup", onPointerUp, { signal })
        window.addEventListener("pointercancel", onPointerUp, { signal })
        window.addEventListener("touchmove", onTouchMove, { signal, passive: false })
        window.addEventListener("touchend", onTouchEnd, { signal })
        window.addEventListener("touchcancel", onTouchEnd, { signal })
        window.addEventListener("blur", () => finish(clientX, clientY), { signal })
    }

    const startDrag = (item: Item, category: InventoryCategory, event: ReactPointerEvent) => {
        if (!canDrag()) return
        event.preventDefault()
        event.stopPropagation()
        ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
        startFromPoint(item, category, event.clientX, event.clientY)
    }

    const startDragTouch = (item: Item, category: InventoryCategory, event: ReactTouchEvent) => {
        if (!canDrag()) return
        const touch = event.touches[0]
        if (!touch) return
        event.preventDefault()
        event.stopPropagation()
        startFromPoint(item, category, touch.clientX, touch.clientY)
    }

    return { startDrag, startDragTouch, draggingItemId }
}

export { SLOT_ATTRIBUTE }
