// src/game/ui/InventoryBag.ts
//
// The player's backpack, fully rendered with Phaser objects: a bag sprite fixed
// in the top-right corner of the arena opens a panel that lists the held items
// grouped into the "Artefato", "Completo" and "Componente" dividers.
//
// The grid grows with the content (up to `MAX_COLUMNS` wide and `MAX_ROWS` tall)
// and scrolls once it overflows. The panel draws above the creature health bars
// and is masked to its scroll window, so the items it holds keep working with the
// existing drag-and-drop (equip on a creature, otherwise return to the bag)
// without any DOM/React involvement.

import Phaser from "phaser"
import { Game } from "../scenes/Game"
import { Item } from "../systems/Items/Item"
import { ItemInventory } from "../systems/Items/ItemInventory"
import { INVENTORY_CATEGORIES, InventoryCategory } from "../systems/Items/ItemInventoryLayout"
import {
    attachedPanelPosition,
    bagContentLayout,
    BagContentLayout,
    categoryIndexAt,
    cellAt,
    cellRect,
    clampScroll,
    GridMetrics,
    scrollbarGeometry,
    scrollOffsetFromThumb,
    topRightAnchor,
    Rect,
    ScrollbarGeometry,
} from "../systems/Items/InventoryBagLayout"
import {
    BAG_BADGE_DEPTH,
    BAG_DEPTH,
    ITEM_EQUIPPED_BORDER_DEPTH,
    ITEM_EQUIPPED_DEPTH,
    ITEM_FLY_DEPTH,
    ITEM_SLOT_DEPTH,
    PANEL_BLOCKER_DEPTH,
    PANEL_DEPTH,
    PANEL_UI_DEPTH,
} from "../systems/Items/InventoryDepths"
import type { InventoryDeposit } from "../systems/Items/ItemDeposit"
import { EventBus } from "../tools/EventBus"

const BAG_TEXTURE = "inventory-bag"

const BAG_DISPLAY_SIZE = 74
const BADGE_OFFSET_X = 24
const BADGE_OFFSET_Y = 24

const PANEL_PADDING = 12
const PANEL_RADIUS = 10
const PANEL_GAP = 12
const VIEWPORT_MARGIN = 8
const HEADER_HEIGHT = 26
const ARENA_MARGIN = 6

const SLOT_SIZE = 46
const SLOT_GAP = 6
const SLOT_ICON_INSET = 10
const DIVIDER_HEIGHT = 26

/** Grid caps requested for the backpack: 5 columns wide, 3 rows before scrolling. */
const MAX_COLUMNS = 5
const MAX_ROWS = 3

const SCROLLBAR_WIDTH = 8
const SCROLLBAR_GUTTER = SCROLLBAR_WIDTH + 6
const WHEEL_STEP = 48

/** Fly-to-bag animation: duration and how small the item gets when it lands. */
const FLY_DURATION = 380
const FLY_END_SCALE = 0.55

/** Smallest panel content width, so the empty-state message is never clipped. */
const MIN_CONTENT_WIDTH = 150

const PANEL_FILL = 0x1e1712
const PANEL_BORDER = 0xb08a4a
const SLOT_FILL = 0x2b2218
const SLOT_BORDER = 0x6b5636
const DIVIDER_COLOR = 0x6b5636
const SCROLLBAR_TRACK = 0x2b2218
const SCROLLBAR_THUMB = 0x8a6f42
const SCROLLBAR_THUMB_HOVER = 0xc0a06a

const TEXT_COLOR = "#f2e2c4"
const MUTED_COLOR = "#b7a184"
const ACCENT_COLOR = "#ffd98a"

/** Matches the Item drag threshold so a press needs real movement to become a drag. */
const DRAG_THRESHOLD = 32

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
    artifact: "Artefato",
    completed: "Completo",
    component: "Componente",
}

export class InventoryBag {
    private readonly scene: Game
    private readonly inventory: ItemInventory
    private readonly metrics: GridMetrics = {
        slotSize: SLOT_SIZE,
        gap: SLOT_GAP,
        dividerHeight: DIVIDER_HEIGHT,
        maxColumns: MAX_COLUMNS,
        maxRows: MAX_ROWS,
    }

    private readonly bag: Phaser.GameObjects.Image
    private readonly badge: Phaser.GameObjects.Text
    private readonly blocker: Phaser.GameObjects.Rectangle
    private readonly panel: Phaser.GameObjects.Container
    private readonly panelGraphics: Phaser.GameObjects.Graphics
    private readonly titleText: Phaser.GameObjects.Text
    private readonly closeText: Phaser.GameObjects.Text
    private readonly emptyText: Phaser.GameObjects.Text
    private readonly content: Phaser.GameObjects.Container
    private readonly contentGraphics: Phaser.GameObjects.Graphics
    private readonly categoryLabels: Phaser.GameObjects.Text[] = []
    private readonly scrollTrack: Phaser.GameObjects.Rectangle
    private readonly scrollThumb: Phaser.GameObjects.Rectangle
    // Phaser captures the hit area when `setInteractive` runs, so both resizable
    // rectangles keep their own geoms in sync with their size.
    private readonly blockerHitArea: Phaser.Geom.Rectangle
    private readonly thumbHitArea: Phaser.Geom.Rectangle
    private readonly maskShape: Phaser.GameObjects.Graphics
    private readonly contentMask: Phaser.Display.Masks.GeometryMask

    private layout: BagContentLayout
    private scroll = 0
    private panelWidth = 0
    private panelHeight = 0
    private viewportHeight = SLOT_SIZE

    private opened = false
    private pressed = false
    private dragged = false
    private draggingSprite?: Phaser.GameObjects.GameObject
    private lastDragY = 0
    private disposed = false

    /**
     * Items on their way into the bag, drawn as transient copies. While an item is
     * here the grid skips it, so it never appears twice during the flight.
     */
    private readonly flying = new Map<Item, Phaser.GameObjects.Image>()

    private readonly onInventoryChange = () => this.refresh()
    private readonly onDeposit = (deposit: InventoryDeposit) => this.flyToBag(deposit.item, deposit.from)
    private readonly onScenePointerUp = () => this.handlePointerUp()
    private readonly onSceneDragStart = (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        this.dragged = true
        this.draggingSprite = gameObject

        for (const item of this.inventory) {
            if (item.sprite !== gameObject) continue

            // The dragged item must escape the scroll window to reach creatures.
            item.sprite.clearMask()
            break
        }
    }
    private readonly onSceneDragEnd = () => {
        this.draggingSprite = undefined
        this.refresh()
    }
    private readonly onWheel = (pointer: Phaser.Input.Pointer, _objects: unknown, _deltaX: number, deltaY: number) => {
        if (!this.opened) return
        if (!this.containsContentWindow(pointer.x, pointer.y)) return

        this.scrollBy(deltaY > 0 ? WHEEL_STEP : -WHEEL_STEP)
    }

    constructor(scene: Game, inventory: ItemInventory) {
        this.scene = scene
        this.inventory = inventory
        this.layout = bagContentLayout({ artifact: 0, completed: 0, component: 0 }, this.metrics)

        const anchor = topRightAnchor(this.region(), this.bagSize(), ARENA_MARGIN)

        this.bag = scene.add
            .image(anchor.x, anchor.y, BAG_TEXTURE)
            .setDisplaySize(BAG_DISPLAY_SIZE, BAG_DISPLAY_SIZE)
            .setDepth(BAG_DEPTH)
            .setInteractive({ useHandCursor: true })

        this.badge = scene.add
            .text(anchor.x + BADGE_OFFSET_X, anchor.y + BADGE_OFFSET_Y, "", {
                fontSize: "15px",
                fontFamily: "Arial",
                color: "#2a1e10",
                backgroundColor: "#ffd98a",
                padding: { left: 5, right: 5, top: 1, bottom: 1 },
            })
            .setOrigin(0.5)
            .setDepth(BAG_BADGE_DEPTH)

        // Invisible surface that owns the pointer over the open panel: it is the
        // scroll gesture target for touch and keeps creatures behind the panel out
        // of the way while it is visible.
        this.blockerHitArea = new Phaser.Geom.Rectangle(0, 0, 1, 1)
        this.blocker = scene.add
            .rectangle(0, 0, 1, 1, 0x000000, 0)
            .setOrigin(0, 0)
            .setDepth(PANEL_BLOCKER_DEPTH)
            .setInteractive({ hitArea: this.blockerHitArea, hitAreaCallback: Phaser.Geom.Rectangle.Contains })

        this.panel = scene.add.container(0, 0).setDepth(PANEL_DEPTH).setVisible(false)
        this.panelGraphics = scene.add.graphics()
        this.content = scene.add.container(0, 0)
        this.contentGraphics = scene.add.graphics()

        this.titleText = scene.add.text(PANEL_PADDING, PANEL_PADDING, "Bolsa", {
            fontSize: "15px",
            fontFamily: "Arial",
            color: TEXT_COLOR,
        })
        this.closeText = scene.add
            .text(0, PANEL_PADDING - 2, "X", {
                fontSize: "16px",
                fontFamily: "Arial",
                color: MUTED_COLOR,
            })
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })

        this.emptyText = scene.add
            .text(0, 0, "A bolsa está vazia", {
                fontSize: "13px",
                fontFamily: "Arial",
                color: MUTED_COLOR,
            })
            .setOrigin(0.5)

        for (const category of INVENTORY_CATEGORIES) {
            this.categoryLabels.push(
                scene.add.text(0, 0, CATEGORY_LABELS[category], {
                    fontSize: "13px",
                    fontFamily: "Arial",
                    color: ACCENT_COLOR,
                })
            )
        }

        this.content.add([this.contentGraphics, ...this.categoryLabels])
        this.panel.add([this.panelGraphics, this.titleText, this.closeText, this.emptyText, this.content])

        this.scrollTrack = scene.add.rectangle(0, 0, SCROLLBAR_WIDTH, 1, SCROLLBAR_TRACK, 0.7).setOrigin(0, 0).setDepth(PANEL_UI_DEPTH)
        this.thumbHitArea = new Phaser.Geom.Rectangle(0, 0, SCROLLBAR_WIDTH, 1)
        this.scrollThumb = scene.add
            .rectangle(0, 0, SCROLLBAR_WIDTH, 1, SCROLLBAR_THUMB, 1)
            .setOrigin(0, 0)
            .setDepth(PANEL_UI_DEPTH + 1)
            .setInteractive({ hitArea: this.thumbHitArea, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true })

        // Mask for the scroll window: the panel chrome stays unmasked while the
        // content container and every item placed in a slot are clipped to it.
        this.maskShape = scene.make.graphics({ x: 0, y: 0 }, false)
        this.contentMask = this.maskShape.createGeometryMask()
        this.content.setMask(this.contentMask)

        this.installInput()
        this.layoutPanel()
        this.refresh()

        EventBus.on("inventory-change", this.onInventoryChange)
        EventBus.on("inventory-deposit", this.onDeposit)
    }

    private bagSize(): { width: number; height: number } {
        return { width: BAG_DISPLAY_SIZE, height: BAG_DISPLAY_SIZE }
    }

    /** Playable map area: the bag is anchored to its top-right corner. */
    private region(): Rect {
        const bounds = this.scene.background.getBounds()
        return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
    }

    private viewport(): Rect {
        return { x: 0, y: 0, width: this.scene.cameras.main.width, height: this.scene.cameras.main.height }
    }

    private contentWidth(): number {
        return Math.max(this.layout.gridWidth, MIN_CONTENT_WIDTH)
    }

    /** Panel-local rect of the scroll window. */
    private contentWindow(): Rect {
        return { x: PANEL_PADDING, y: PANEL_PADDING + HEADER_HEIGHT, width: this.contentWidth(), height: this.viewportHeight }
    }

    private containsContentWindow(x: number, y: number): boolean {
        const window = this.contentWindow()
        const rect = { x: this.panel.x + window.x, y: this.panel.y + window.y, width: window.width, height: window.height }

        return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
    }

    private panelRect(): Rect {
        return { x: this.panel.x, y: this.panel.y, width: this.panelWidth, height: this.panelHeight }
    }

    private installInput() {
        this.scene.input.dragDistanceThreshold = DRAG_THRESHOLD

        this.bag.on("pointerover", () => this.bag.setTint(0xffe9b0))
        this.bag.on("pointerout", () => this.bag.clearTint())
        this.bag.on("pointerdown", () => {
            if (this.scene.state !== "idle") return

            this.pressed = true
            this.dragged = false
        })

        this.closeText.on("pointerdown", () => this.close())

        // Dragging the panel surface (never an item drawn on top of it) scrolls.
        this.scene.input.setDraggable(this.blocker)
        this.blocker.on("dragstart", (pointer: Phaser.Input.Pointer) => {
            this.lastDragY = pointer.y
        })
        this.blocker.on("drag", (pointer: Phaser.Input.Pointer) => {
            this.scrollBy(this.lastDragY - pointer.y)
            this.lastDragY = pointer.y
        })
        this.blocker.disableInteractive()

        this.scene.input.setDraggable(this.scrollThumb)
        this.scrollThumb.on("pointerover", () => this.scrollThumb.setFillStyle(SCROLLBAR_THUMB_HOVER, 1))
        this.scrollThumb.on("pointerout", () => this.scrollThumb.setFillStyle(SCROLLBAR_THUMB, 1))
        this.scrollThumb.on("drag", (pointer: Phaser.Input.Pointer) => this.scrollToThumb(pointer.y))

        this.scene.input.on("pointerup", this.onScenePointerUp)
        this.scene.input.on("dragstart", this.onSceneDragStart)
        this.scene.input.on("dragend", this.onSceneDragEnd)
        this.scene.input.on("wheel", this.onWheel)
    }

    private handlePointerUp() {
        if (!this.pressed) return

        this.pressed = false
        if (!this.dragged) this.toggle()
    }

    toggle() {
        if (this.opened) this.close()
        else this.open()
    }

    open() {
        if (this.opened || this.disposed) return

        this.opened = true
        this.scroll = 0
        this.panel.setVisible(true)
        this.blocker.setInteractive()
        this.refresh()
    }

    close() {
        if (!this.opened) return

        this.opened = false
        this.panel.setVisible(false)
        this.blocker.disableInteractive()
        this.scrollTrack.setVisible(false)
        this.scrollThumb.setVisible(false)
        this.refresh()
    }

    /** True while the bag icon or the open panel owns the given world point. */
    blocksPoint(x: number, y: number): boolean {
        if (this.disposed) return false

        const half = this.bag.displayWidth / 2
        if (x >= this.bag.x - half && x <= this.bag.x + half && y >= this.bag.y - half && y <= this.bag.y + half) return true
        if (!this.opened) return false

        const rect = this.panelRect()
        return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
    }

    /**
     * Called by `Item` when a drag ends. Re-applies the presentation that matches
     * where the item landed: a backpack slot while it is still held, otherwise the
     * world layer used by equipped items.
     */
    presentItem(item: Item) {
        if (this.disposed) return

        if (!this.inventory.has(item)) {
            item.sprite.clearMask()
            item.sprite.setDepth(ITEM_EQUIPPED_DEPTH)
            item.border.setDepth(ITEM_EQUIPPED_BORDER_DEPTH)
            return
        }

        this.refresh()
    }

    /**
     * Visible spot where items without a physical source (rewards, the anvil) show up
     * before flying into the bag.
     */
    deliveryPoint(): { x: number; y: number } {
        const region = this.region()

        return { x: region.x + region.width / 2, y: region.y + region.height / 2 }
    }

    /**
     * Flies a transient copy of the item from `from` into the bag icon. The item's own
     * sprite stays stored (and out of the grid) until the copy lands, so an item is
     * never rendered twice and a second deposit while it flies is ignored.
     */
    flyToBag(item: Item, from: { x: number; y: number }) {
        if (this.disposed || this.flying.has(item)) return

        item.store()

        const image = this.scene.add
            .image(from.x, from.y, item.sprite.texture.key)
            .setScale(item.sprite.scaleX || 1)
            .setDepth(ITEM_FLY_DEPTH)

        this.flying.set(item, image)

        this.scene.tweens.add({
            targets: image,
            x: this.bag.x,
            y: this.bag.y,
            scale: image.scale * FLY_END_SCALE,
            duration: FLY_DURATION,
            ease: "Cubic.easeIn",
            onComplete: () => this.landItem(item),
        })
    }

    private landItem(item: Item) {
        this.flying.get(item)?.destroy()
        this.flying.delete(item)

        if (this.disposed) return

        this.refresh()
    }

    /** Drops every in-flight copy, used when the run is reset and on teardown. */
    cancelFlights() {
        for (const image of this.flying.values()) {
            this.scene.tweens.killTweensOf(image)
            image.destroy()
        }

        this.flying.clear()
    }

    /** True while the item is either being dragged or still flying into the bag. */
    private isPending(item: Item): boolean {
        return item.sprite === this.draggingSprite || this.flying.has(item)
    }

    /**
     * Called by `Item` when an item was dropped and not equipped. Reorders the
     * item when the drop happened on a slot of its own category.
     */
    handleSlotDrop(item: Item, pointer: Phaser.Input.Pointer) {
        const target = this.cellUnderPointer(pointer.worldX, pointer.worldY)
        if (!target) return
        if (target.category !== this.inventory.categoryOf(item)) return

        this.inventory.reorder(item.id, target.index)
    }

    private cellUnderPointer(worldX: number, worldY: number): { category: InventoryCategory; index: number } | undefined {
        if (!this.opened) return undefined

        const cell = cellAt(worldX - this.content.x, worldY - this.content.y, this.layout, this.metrics)
        if (!cell) return undefined

        return categoryIndexAt(this.layout, cell.row, cell.column)
    }

    /** Recomputes the grid for the current inventory and redraws the panel. */
    refresh() {
        if (this.disposed) return

        this.updateBadge()

        const groups = this.inventory.snapshot()

        if (!this.opened) {
            this.storeItems(groups)
            return
        }

        this.layout = bagContentLayout(
            {
                artifact: groups.artifact.length,
                completed: groups.completed.length,
                component: groups.component.length,
            },
            this.metrics
        )
        this.scroll = clampScroll(this.scroll, this.layout.scrollRange)

        this.layoutPanel()
        this.drawPanel()
        this.drawContent()
        this.placeItems(groups)
        this.updateScrollbar()
    }

    /** Sizes the panel from the current grid, then repositions it and its mask. */
    private layoutPanel() {
        this.viewportHeight = this.layout.rows === 0 ? SLOT_SIZE : this.layout.viewportHeight
        this.panelWidth = PANEL_PADDING * 2 + this.contentWidth() + SCROLLBAR_GUTTER
        this.panelHeight = PANEL_PADDING * 2 + HEADER_HEIGHT + this.viewportHeight

        this.reposition()
        this.updateMask()
    }

    /** Places the icon, the panel, the scroll surface and the scrollbar. */
    private reposition() {
        const anchor = topRightAnchor(this.region(), this.bagSize(), ARENA_MARGIN)

        this.bag.setPosition(anchor.x, anchor.y)
        this.badge.setPosition(anchor.x + BADGE_OFFSET_X, anchor.y + BADGE_OFFSET_Y)

        const position = attachedPanelPosition(
            anchor,
            this.bagSize(),
            this.viewport(),
            { width: this.panelWidth, height: this.panelHeight },
            PANEL_GAP,
            VIEWPORT_MARGIN
        )

        const window = this.contentWindow()

        this.panel.setPosition(position.x, position.y)
        this.blocker.setPosition(position.x, position.y)
        this.blocker.setSize(this.panelWidth, this.panelHeight)
        this.blockerHitArea.setSize(this.panelWidth, this.panelHeight)
        this.titleText.setPosition(PANEL_PADDING, PANEL_PADDING)
        this.closeText.setPosition(this.panelWidth - PANEL_PADDING, PANEL_PADDING - 2)
        this.emptyText.setPosition(PANEL_PADDING + window.width / 2, window.y + window.height / 2)
        this.scrollTrack
            .setPosition(this.panelWidth - PANEL_PADDING - SCROLLBAR_WIDTH + 2, window.y)
            .setSize(SCROLLBAR_WIDTH, window.height)
        this.content.setPosition(position.x + window.x, position.y + window.y - this.scroll)
    }

    private updateMask() {
        const window = this.contentWindow()

        this.maskShape.clear()
        this.maskShape.fillStyle(0xffffff, 1)
        this.maskShape.fillRect(this.panel.x + window.x, this.panel.y + window.y, window.width, window.height)
    }

    private drawPanel() {
        const graphics = this.panelGraphics
        const headerBottom = PANEL_PADDING + HEADER_HEIGHT - 4

        graphics.clear()
        graphics.fillStyle(PANEL_FILL, 0.94).fillRoundedRect(0, 0, this.panelWidth, this.panelHeight, PANEL_RADIUS)
        graphics.lineStyle(2, PANEL_BORDER, 0.9).strokeRoundedRect(0, 0, this.panelWidth, this.panelHeight, PANEL_RADIUS)
        graphics.lineStyle(1, DIVIDER_COLOR, 0.5).lineBetween(PANEL_PADDING, headerBottom, this.panelWidth - PANEL_PADDING, headerBottom)

        this.emptyText.setVisible(this.layout.rows === 0)
    }

    /** Draws the slots and the labelled dividers in content-local coordinates. */
    private drawContent() {
        const graphics = this.contentGraphics
        const layout = this.layout

        graphics.clear()
        if (layout.rows === 0) return

        for (const run of layout.runs) {
            for (let local = 0; local < run.rows; local++) {
                const rowTop = layout.rowTops[run.startRow + local]

                for (let column = 0; column < layout.columns; column++) {
                    const index = local * layout.columns + column
                    const rect = cellRect(column, rowTop, { x: 0, y: 0 }, this.metrics)

                    graphics.fillStyle(SLOT_FILL, 0.9).fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 6)
                    graphics.lineStyle(1, SLOT_BORDER, index < run.count ? 0.8 : 0.35).strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 6)
                }
            }
        }

        layout.dividerTops.forEach((top, index) => {
            const run = layout.runs[index + 1]
            const label = this.categoryLabels[index]

            graphics.lineStyle(1, DIVIDER_COLOR, 0.7).lineBetween(0, top + DIVIDER_HEIGHT - 6, layout.gridWidth, top + DIVIDER_HEIGHT - 6)
            label.setPosition(0, top + 2).setText(CATEGORY_LABELS[run.category]).setVisible(true)
        })

        for (let index = layout.dividerTops.length; index < this.categoryLabels.length; index++) {
            this.categoryLabels[index].setVisible(false)
        }
    }

    /** Places every held item on its cell, storing the ones outside the window. */
    private placeItems(groups: Record<InventoryCategory, Item[]>) {
        const placed = new Set<Item>()
        const layout = this.layout

        if (this.opened) {
            for (const run of layout.runs) {
                groups[run.category].forEach((item, index) => {
                    placed.add(item)
                    if (this.isPending(item)) return

                    const row = run.startRow + Math.floor(index / layout.columns)
                    const column = index % layout.columns
                    const rect = cellRect(column, layout.rowTops[row], { x: 0, y: 0 }, this.metrics)

                    // Cells scrolled out of the window stay hidden so they can never
                    // be hovered or used as a drop target.
                    if (rect.y + rect.height <= this.scroll || rect.y >= this.scroll + this.viewportHeight) {
                        item.store()
                        return
                    }

                    item.showInSlot(this.content.x + rect.x + rect.width / 2, this.content.y + rect.y + rect.height / 2, SLOT_SIZE - SLOT_ICON_INSET, ITEM_SLOT_DEPTH)
                    item.sprite.setMask(this.contentMask)
                })
            }
        }

        for (const category of INVENTORY_CATEGORIES) {
            for (const item of groups[category]) {
                if (placed.has(item)) continue

                item.store()
            }
        }
    }

    private storeItems(groups: Record<InventoryCategory, Item[]>) {
        for (const category of INVENTORY_CATEGORIES) {
            for (const item of groups[category]) {
                if (this.isPending(item)) continue

                item.store()
            }
        }
    }

    private updateScrollbar() {
        const geometry = this.opened ? this.scrollGeometry() : undefined

        if (!geometry) {
            this.scrollTrack.setVisible(false)
            this.scrollThumb.setVisible(false)
            return
        }

        this.scrollTrack.setVisible(true)
        this.scrollThumb.setVisible(true).setSize(geometry.thumb.width, geometry.thumb.height).setPosition(geometry.thumb.x, geometry.thumb.y)
        this.thumbHitArea.setSize(geometry.thumb.width, geometry.thumb.height)
    }

    private scrollGeometry(): ScrollbarGeometry | undefined {
        const track = { x: this.scrollTrack.x, y: this.scrollTrack.y, width: SCROLLBAR_WIDTH, height: this.viewportHeight }

        return scrollbarGeometry(track, this.layout.contentHeight, this.viewportHeight, this.scroll)
    }

    /** Scrolls by a pixel delta, clamped to the content. */
    scrollBy(delta: number) {
        if (this.layout.scrollRange <= 0) return

        const next = clampScroll(this.scroll + delta, this.layout.scrollRange)
        if (next === this.scroll) return

        this.scroll = next
        this.applyScroll()
    }

    private scrollToThumb(pointerY: number) {
        const geometry = this.scrollGeometry()
        if (!geometry) return

        const next = clampScroll(scrollOffsetFromThumb(pointerY - geometry.thumb.height / 2, geometry, this.layout.scrollRange), this.layout.scrollRange)
        if (next === this.scroll) return

        this.scroll = next
        this.applyScroll()
    }

    /** Moves the content container and the slotted items to the current offset. */
    private applyScroll() {
        const window = this.contentWindow()
        this.content.setPosition(this.panel.x + window.x, this.panel.y + window.y - this.scroll)

        this.placeItems(this.inventory.snapshot())
        this.updateScrollbar()
    }

    private updateBadge() {
        const total = this.inventory.size
        this.badge.setText(String(total)).setPosition(this.bag.x + BADGE_OFFSET_X, this.bag.y + BADGE_OFFSET_Y)
        this.badge.setVisible(total > 0)
    }

    dispose() {
        if (this.disposed) return

        this.disposed = true
        EventBus.off("inventory-change", this.onInventoryChange)
        EventBus.off("inventory-deposit", this.onDeposit)
        this.scene.input.off("pointerup", this.onScenePointerUp)
        this.scene.input.off("dragstart", this.onSceneDragStart)
        this.scene.input.off("dragend", this.onSceneDragEnd)
        this.scene.input.off("wheel", this.onWheel)

        this.cancelFlights()

        for (const item of this.inventory) {
            item.sprite.clearMask()
        }

        this.content.setMask(undefined)
        this.contentMask.destroy()
        this.maskShape.destroy()

        this.bag.destroy()
        this.badge.destroy()
        this.blocker.destroy()
        this.scrollTrack.destroy()
        this.scrollThumb.destroy()
        this.panel.destroy(true)
    }
}
