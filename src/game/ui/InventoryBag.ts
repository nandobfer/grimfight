// src/game/ui/InventoryBag.ts
//
// The player's backpack, fully rendered with Phaser objects: a bag sprite that
// spawns in a random corner of the arena and can be dragged around, plus a
// panel with one grid per item category ("Artefato", "Completo", "Componente").
//
// The panel keeps every held item visible in its own slot so the existing item
// drag-and-drop (equip on a creature, otherwise return to the bag) keeps working
// without any DOM/React involvement.

import Phaser from "phaser"
import { Game } from "../scenes/Game"
import { Item } from "../systems/Items/Item"
import { ItemInventory } from "../systems/Items/ItemInventory"
import { INVENTORY_CATEGORIES, InventoryCategory } from "../systems/Items/ItemInventoryLayout"
import { clampToRegion, cornerSpawnPosition, paginate, panelPosition, rectContains, slotRects, Point, Rect, Size } from "../systems/Items/InventoryBagLayout"
import { EventBus } from "../tools/EventBus"

const BAG_TEXTURE = "inventory-bag"

const BAG_DISPLAY_SIZE = 74
const BADGE_OFFSET_X = 24
const BADGE_OFFSET_Y = 24

const PANEL_PADDING = 12
const PANEL_RADIUS = 10
const PANEL_GAP = 10
const VIEWPORT_MARGIN = 10
const HEADER_HEIGHT = 24
const FOOTER_HEIGHT = 22
const CATEGORY_LABEL_HEIGHT = 18
const CATEGORY_GAP = 10
const SLOT_SIZE = 46
const SLOT_GAP = 6
const SLOT_ICON_INSET = 10

const SPAWN_INSET = 4
const SPAWN_JITTER = 26

/** Mirrors the Item drag threshold so a press needs real movement to become a drag. */
const BAG_DRAG_THRESHOLD = 32

const PANEL_DEPTH = 900
const BAG_DEPTH = 1100
const BAG_BADGE_DEPTH = 1101

const PANEL_FILL = 0x1e1712
const PANEL_BORDER = 0xb08a4a
const SLOT_FILL = 0x2b2218
const SLOT_BORDER = 0x6b5636
const DIVIDER_COLOR = 0x6b5636

const TEXT_COLOR = "#f2e2c4"
const MUTED_COLOR = "#b7a184"
const ACCENT_COLOR = "#ffd98a"

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
    artifact: "Artefato",
    completed: "Completo",
    component: "Componente",
}

interface SlotTarget {
    /** Slot in panel-local coordinates. */
    rect: Rect
    /** Slot in world coordinates, used for pointer hit tests. */
    world: Rect
    category: InventoryCategory
    /** Index of the slot inside its category (already offset by the current page). */
    index: number
    item?: Item
}

export class InventoryBag {
    private readonly scene: Game
    private readonly inventory: ItemInventory

    private readonly bag: Phaser.GameObjects.Image
    private readonly badge: Phaser.GameObjects.Text
    private readonly panel: Phaser.GameObjects.Container
    private readonly panelGraphics: Phaser.GameObjects.Graphics
    private readonly panelBlocker: Phaser.GameObjects.Rectangle
    private readonly titleText: Phaser.GameObjects.Text
    private readonly closeText: Phaser.GameObjects.Text
    private readonly emptyText: Phaser.GameObjects.Text
    private readonly pageText: Phaser.GameObjects.Text
    private readonly previousText: Phaser.GameObjects.Text
    private readonly nextText: Phaser.GameObjects.Text
    private readonly categoryLabels: Phaser.GameObjects.Text[] = []

    private readonly columns: number
    private readonly rowsPerCategory: number
    private readonly perCategoryPerPage: number
    private readonly panelWidth: number
    private readonly panelHeight: number

    private slots: SlotTarget[] = []
    private page = 0
    private pageCount = 1
    private opened = false
    private pressed = false
    private dragged = false
    private draggingSprite?: Phaser.GameObjects.GameObject
    private disposed = false

    private readonly onInventoryChange = () => this.refresh()
    private readonly onScenePointerUp = () => this.handlePointerUp()
    private readonly onSceneDragStart = (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (gameObject !== this.bag) this.draggingSprite = gameObject
    }
    private readonly onSceneDragEnd = () => {
        this.draggingSprite = undefined
        this.refresh()
    }

    constructor(scene: Game, inventory: ItemInventory, position?: Point) {
        this.scene = scene
        this.inventory = inventory

        const os = scene.sys.game.device.os
        const isMobile = os.android || os.iOS

        this.columns = isMobile ? 3 : 4
        this.rowsPerCategory = isMobile ? 1 : 2
        this.perCategoryPerPage = this.columns * this.rowsPerCategory
        this.panelWidth = PANEL_PADDING * 2 + this.columns * SLOT_SIZE + (this.columns - 1) * SLOT_GAP
        this.panelHeight =
            PANEL_PADDING * 2 +
            HEADER_HEIGHT +
            INVENTORY_CATEGORIES.length * (CATEGORY_LABEL_HEIGHT + this.rowsPerCategory * SLOT_SIZE + (this.rowsPerCategory - 1) * SLOT_GAP + CATEGORY_GAP) +
            FOOTER_HEIGHT

        // A saved position may be stale (different arena size), so it is always
        // clamped back into the map; without one the bag spawns on a random corner.
        const spawn = clampToRegion(
            position ?? cornerSpawnPosition(this.region(), this.bagSize(), Math.random, SPAWN_INSET, SPAWN_JITTER).position,
            this.region(),
            this.bagSize()
        )

        this.bag = scene.add
            .image(spawn.x, spawn.y, BAG_TEXTURE)
            .setDisplaySize(BAG_DISPLAY_SIZE, BAG_DISPLAY_SIZE)
            .setDepth(BAG_DEPTH)
            .setInteractive({ useHandCursor: true })
        scene.input.setDraggable(this.bag)

        this.badge = scene.add
            .text(spawn.x + BADGE_OFFSET_X, spawn.y + BADGE_OFFSET_Y, "", {
                fontSize: "15px",
                fontFamily: "Arial",
                color: "#2a1e10",
                backgroundColor: "#ffd98a",
                padding: { left: 5, right: 5, top: 1, bottom: 1 },
            })
            .setOrigin(0.5)
            .setDepth(BAG_BADGE_DEPTH)

        this.panel = scene.add.container(0, 0).setDepth(PANEL_DEPTH).setVisible(false)

        this.panelBlocker = scene.add.rectangle(0, 0, this.panelWidth, this.panelHeight, 0x000000, 0).setOrigin(0, 0).setInteractive()
        this.panelGraphics = scene.add.graphics()
        this.titleText = scene.add.text(PANEL_PADDING, PANEL_PADDING, "Bolsa", {
            fontSize: "15px",
            fontFamily: "Arial",
            color: TEXT_COLOR,
        })
        this.closeText = scene.add
            .text(this.panelWidth - PANEL_PADDING, PANEL_PADDING - 2, "X", {
                fontSize: "16px",
                fontFamily: "Arial",
                color: MUTED_COLOR,
            })
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })

        this.emptyText = scene.add
            .text(this.panelWidth / 2, this.panelHeight / 2, "A bolsa está vazia", {
                fontSize: "13px",
                fontFamily: "Arial",
                color: MUTED_COLOR,
            })
            .setOrigin(0.5)

        this.previousText = scene.add
            .text(PANEL_PADDING, this.panelHeight - PANEL_PADDING - FOOTER_HEIGHT + 2, "<", {
                fontSize: "15px",
                fontFamily: "Arial",
                color: ACCENT_COLOR,
            })
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true })
        this.nextText = scene.add
            .text(this.panelWidth - PANEL_PADDING, this.panelHeight - PANEL_PADDING - FOOTER_HEIGHT + 2, ">", {
                fontSize: "15px",
                fontFamily: "Arial",
                color: ACCENT_COLOR,
            })
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
        this.pageText = scene.add
            .text(this.panelWidth / 2, this.panelHeight - PANEL_PADDING - FOOTER_HEIGHT + 2, "", {
                fontSize: "13px",
                fontFamily: "Arial",
                color: MUTED_COLOR,
            })
            .setOrigin(0.5, 0)

        for (const category of INVENTORY_CATEGORIES) {
            this.categoryLabels.push(
                scene.add.text(PANEL_PADDING, 0, CATEGORY_LABELS[category], {
                    fontSize: "13px",
                    fontFamily: "Arial",
                    color: ACCENT_COLOR,
                })
            )
        }

        this.panel.add([
            this.panelBlocker,
            this.panelGraphics,
            this.titleText,
            this.closeText,
            this.emptyText,
            this.previousText,
            this.nextText,
            this.pageText,
            ...this.categoryLabels,
        ])

        this.installInput()
        this.positionPanel()
        this.updateBadge()

        EventBus.on("inventory-change", this.onInventoryChange)
    }

    private bagSize(): Size {
        return { width: this.bag.displayWidth, height: this.bag.displayHeight }
    }

    /** Playable map area used both for spawning and for dragging the bag. */
    private region(): Rect {
        const bounds = this.scene.background.getBounds()
        return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
    }

    private viewport(): Rect {
        return { x: 0, y: 0, width: this.scene.cameras.main.width, height: this.scene.cameras.main.height }
    }

    private installInput() {
        // Matches the Item drag threshold: the pointer must travel this far before
        // a press becomes a drag, so a plain click still toggles the panel.
        this.scene.input.dragDistanceThreshold = BAG_DRAG_THRESHOLD

        this.bag.on("pointerover", () => this.bag.setTint(0xffe9b0))
        this.bag.on("pointerout", () => this.bag.clearTint())

        this.bag.on("pointerdown", () => {
            if (this.scene.state !== "idle") return
            this.pressed = true
            this.dragged = false
        })

        this.bag.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            this.dragged = true
            this.moveBag(dragX, dragY)
        })

        this.bag.on("dragend", () => {
            this.dragged = true
            this.scene.saveProgress()
        })

        this.closeText.on("pointerdown", () => this.close())
        this.previousText.on("pointerdown", () => this.changePage(-1))
        this.nextText.on("pointerdown", () => this.changePage(1))

        this.scene.input.on("pointerup", this.onScenePointerUp)
        this.scene.input.on("dragstart", this.onSceneDragStart)
        this.scene.input.on("dragend", this.onSceneDragEnd)
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
        this.page = 0
        this.panel.setVisible(true)
        this.refresh()
    }

    close() {
        if (!this.opened) return

        this.opened = false
        this.panel.setVisible(false)
        this.refresh()
    }

    /** Moves the bag to a new random corner of the map. */
    spawnRandom() {
        const spawn = cornerSpawnPosition(this.region(), this.bagSize(), Math.random, SPAWN_INSET, SPAWN_JITTER)
        this.moveBag(spawn.position.x, spawn.position.y)
    }

    getPosition(): Point {
        return { x: this.bag.x, y: this.bag.y }
    }

    private moveBag(x: number, y: number) {
        const clamped = clampToRegion({ x, y }, this.region(), this.bagSize())

        this.bag.setPosition(clamped.x, clamped.y)
        this.badge.setPosition(clamped.x + BADGE_OFFSET_X, clamped.y + BADGE_OFFSET_Y)

        const previousX = this.panel.x
        const previousY = this.panel.y
        this.positionPanel()

        if (this.opened) this.shiftItems(this.panel.x - previousX, this.panel.y - previousY)
    }

    /**
     * Moves the slotted items with the panel. Keeps the slot hit areas in sync
     * without rebuilding the panel graphics on every drag frame.
     */
    private shiftItems(dx: number, dy: number) {
        if (dx === 0 && dy === 0) return

        for (const slot of this.slots) {
            slot.world.x += dx
            slot.world.y += dy

            const item = slot.item
            if (!item || item.sprite === this.draggingSprite) continue

            item.showInSlot(slot.world.x + slot.world.width / 2, slot.world.y + slot.world.height / 2, SLOT_SIZE - SLOT_ICON_INSET)
        }
    }

    private positionPanel() {
        const position = panelPosition(
            { x: this.bag.x, y: this.bag.y },
            this.bagSize(),
            this.viewport(),
            { width: this.panelWidth, height: this.panelHeight },
            PANEL_GAP,
            VIEWPORT_MARGIN
        )

        this.panel.setPosition(position.x, position.y)
    }

    /** True while the open panel owns the given world point. */
    blocksPoint(x: number, y: number): boolean {
        if (this.disposed || !this.opened) return false

        return rectContains({ x: this.panel.x, y: this.panel.y, width: this.panelWidth, height: this.panelHeight }, x, y)
    }

    private changePage(direction: number) {
        const next = Phaser.Math.Clamp(this.page + direction, 0, this.pageCount - 1)
        if (next === this.page) return

        this.page = next
        this.refresh()
    }

    /**
     * Called by `Item` when an item was dropped and not equipped. Reorders the
     * item when the drop happened on a slot of its own category.
     */
    handleSlotDrop(item: Item, pointer: Phaser.Input.Pointer) {
        const x = pointer.worldX
        const y = pointer.worldY
        if (!this.blocksPoint(x, y)) return

        const target = this.slots.find((slot) => rectContains(slot.world, x, y))
        if (!target) return
        if (target.category !== this.inventory.categoryOf(item)) return

        this.inventory.reorder(item.id, target.index)
    }

    /** Redraws the panel and places every held item on its slot. */
    refresh() {
        if (this.disposed) return

        this.updateBadge()

        if (!this.opened) {
            for (const item of this.inventory) {
                if (item.sprite === this.draggingSprite) continue
                item.store()
            }
            return
        }

        const groups = this.inventory.snapshot()
        this.pageCount = Math.max(
            1,
            ...INVENTORY_CATEGORIES.map((category) => paginate(groups[category], 0, this.perCategoryPerPage).pageCount)
        )
        this.page = Phaser.Math.Clamp(this.page, 0, this.pageCount - 1)

        this.drawPanel(groups)
        this.placeItems(groups)
    }

    private drawPanel(groups: Record<InventoryCategory, Item[]>) {
        const graphics = this.panelGraphics
        graphics.clear()
        graphics.fillStyle(PANEL_FILL, 0.94).fillRoundedRect(0, 0, this.panelWidth, this.panelHeight, PANEL_RADIUS)
        graphics.lineStyle(2, PANEL_BORDER, 0.9).strokeRoundedRect(0, 0, this.panelWidth, this.panelHeight, PANEL_RADIUS)

        this.slots = []

        const panelX = this.panel.x
        const panelY = this.panel.y
        let cursorY = PANEL_PADDING + HEADER_HEIGHT

        INVENTORY_CATEGORIES.forEach((category, index) => {
            this.categoryLabels[index].setPosition(PANEL_PADDING, cursorY)
            cursorY += CATEGORY_LABEL_HEIGHT

            const page = paginate(groups[category], this.page, this.perCategoryPerPage)
            const rects = slotRects({ x: PANEL_PADDING, y: cursorY }, this.columns, this.rowsPerCategory, SLOT_SIZE, SLOT_GAP)

            rects.forEach((rect, slotIndex) => {
                graphics.fillStyle(SLOT_FILL, 0.9).fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 6)
                graphics.lineStyle(1, SLOT_BORDER, 0.8).strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 6)

                this.slots.push({
                    rect,
                    world: { x: panelX + rect.x, y: panelY + rect.y, width: rect.width, height: rect.height },
                    category,
                    index: page.offset + slotIndex,
                    item: page.items[slotIndex],
                })
            })

            cursorY += this.rowsPerCategory * SLOT_SIZE + (this.rowsPerCategory - 1) * SLOT_GAP

            if (index < INVENTORY_CATEGORIES.length - 1) {
                graphics.lineStyle(1, DIVIDER_COLOR, 0.6).lineBetween(PANEL_PADDING, cursorY + CATEGORY_GAP / 2, this.panelWidth - PANEL_PADDING, cursorY + CATEGORY_GAP / 2)
            }

            cursorY += CATEGORY_GAP
        })

        const empty = this.inventory.size === 0
        this.emptyText.setVisible(empty)
        const paged = this.pageCount > 1
        this.previousText.setVisible(paged)
        this.nextText.setVisible(paged)
        this.pageText.setVisible(paged).setText(`${this.page + 1}/${this.pageCount}`)
    }

    private placeItems(groups: Record<InventoryCategory, Item[]>) {
        const placed = new Set<Item>()

        for (const slot of this.slots) {
            const item = slot.item
            if (!item) continue

            if (item.sprite !== this.draggingSprite) {
                item.showInSlot(slot.world.x + slot.world.width / 2, slot.world.y + slot.world.height / 2, SLOT_SIZE - SLOT_ICON_INSET)
            }
            placed.add(item)
        }

        // Items on other pages stay stored (hidden) until their page is shown.
        for (const category of INVENTORY_CATEGORIES) {
            for (const item of groups[category]) {
                if (placed.has(item) || item.sprite === this.draggingSprite) continue
                item.store()
            }
        }
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
        this.scene.input.off("pointerup", this.onScenePointerUp)
        this.scene.input.off("dragstart", this.onSceneDragStart)
        this.scene.input.off("dragend", this.onSceneDragEnd)

        this.bag.destroy()
        this.badge.destroy()
        this.panel.destroy(true)
        this.slots = []
    }
}
