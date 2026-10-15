import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { EventBus } from "../../tools/EventBus"
import { RNG } from "../../tools/RNG"
import { ItemRegistry } from "./ItemRegistry"
import { ITEM_DRAG_BORDER_DEPTH, ITEM_DRAG_DEPTH, ITEM_EQUIPPED_BORDER_DEPTH, ITEM_EQUIPPED_DEPTH } from "./InventoryDepths"
import type { ItemDeposit } from "./ItemDeposit"

export interface PointerPosition {
    x: number
    y: number
}

export class Item {
    key: string
    name: string
    descriptionLines: string[]
    sprite: Phaser.GameObjects.Image
    scene: Game
    user?: Creature
    temporarySource?: "thiefsgloves"

    id = RNG.uuid()

    private border: Phaser.GameObjects.Rectangle
    private preDrag?: { x: number; y: number }
    private emittingMerge = false

    private big_scale = 0.34
    private equiped_scale = 0.17

    private static mergeResultCache = new Map<string, Item>()

    static resetTooltip() {
        EventBus.emit("item-tooltip", null)
    }

    static getMergeResult(scene: Game, items: [Item, Item]) {
        const result = ItemRegistry.getCombinationResult([items[0], items[1]])
        if (result) {
            if (!this.mergeResultCache.has(result)) {
                this.mergeResultCache.set(result, ItemRegistry.create(result, scene, true))
            }

            return this.mergeResultCache.get(result)
        }
    }

    static isThiefsGloves(item: Item) {
        return item.key === "thiefsgloves"
    }

    constructor(scene: Game, texture: string, dataOnly = false) {
        if (!dataOnly) {
            this.scene = scene
            const os = scene.sys.game.device.os
            if (os.android || os.iOS) {
                this.big_scale *= 1.5
            }

            this.sprite = scene.add.image(10000, 10000, texture) // spawning outside game canvas
            this.sprite.setScale(this.big_scale)
            this.sprite.setDepth(ITEM_EQUIPPED_DEPTH)

            this.border = scene.add
                .rectangle(this.sprite.x, this.sprite.y, this.sprite.displayWidth + 6, this.sprite.displayHeight + 6)
                .setOrigin(this.sprite.originX, this.sprite.originY)
                .setStrokeStyle(3, 0xffffff, 1)
                .setDepth(this.sprite.depth + 1)
                .setVisible(false)
                .setAlpha(0.9)

            this.handleMouseEvents()

            this.sprite.once("destroy", () => this.border?.destroy(true))
            scene.events.once("gameover", () => this.sprite.destroy(true))
        }
    }

    smallImage() {
        this.big_scale = 0.5
        this.equiped_scale = 0.25

        const os = this.scene.sys.game.device.os
        if (os.android || os.iOS) {
            this.big_scale *= 1.5
        }

        this.sprite.setScale(this.big_scale)
    }

    private updateBorder() {
        this.border
            .setPosition(this.sprite.x, this.sprite.y)
            .setRotation(this.sprite.rotation)
            .setDisplaySize(this.sprite.displayWidth + 6, this.sprite.displayHeight + 6)
    }

    private showHoverBorder() {
        this.updateBorder()
        this.border.setVisible(true)
        // tween to 1 and STAY there
        this.scene.tweens.add({
            targets: this.border,
            alpha: 1,
            duration: 160,
            ease: "Sine.easeOut",
        })
    }

    private showLooseBorder() {
        this.updateBorder()
        this.border.setVisible(true)
        // tween to 0.6 for idle state
        this.scene.tweens.add({
            targets: this.border,
            alpha: 0.6,
            duration: 160,
            ease: "Sine.easeOut",
        })
    }

    private hideBorder() {
        this.border.setVisible(false)
    }

    // each augment must override
    applyModifier(_creature: Creature) {}

    // each augment must override
    afterApplying(_characters: Creature[]) {}

    // each augment must override
    cleanup(_creature: Creature) {}

    private handleItemOnPoint(pointer: Phaser.Input.Pointer) {
        // The backpack panel owns the pointer while it is over the panel: merging
        // two items is not a backpack gesture.
        if (this.scene.inventoryBag?.blocksPoint(pointer.worldX, pointer.worldY)) return

        const x = Phaser.Math.Clamp(pointer.x, 0, this.scene.scale.width)
        const y = Phaser.Math.Clamp(pointer.y, 0, this.scene.scale.height)

        const targetItem = Array.from(this.scene.availableItems).find((item: Item) => {
            if (!item.sprite.visible) return false

            const bounds = item.sprite.getBounds()
            const adjustedBounds = {
                x: Phaser.Math.Clamp(bounds.x, 0, this.scene.scale.width),
                y: Phaser.Math.Clamp(bounds.y, 0, this.scene.scale.height),
                right: Phaser.Math.Clamp(bounds.right, 0, this.scene.scale.width),
                bottom: Phaser.Math.Clamp(bounds.bottom, 0, this.scene.scale.height),
            }
            const contains = adjustedBounds.x <= x && adjustedBounds.right >= x && adjustedBounds.y <= y && adjustedBounds.bottom >= y
            return contains && item !== this
        })

        if (targetItem) {
            const mergeResult = Item.getMergeResult(this.scene, [this, targetItem])
            if (mergeResult) {
                if (!this.emittingMerge) {
                    const pointerPosition: PointerPosition = this.scene.grid.pointerToClient(pointer)
                    EventBus.emit("item-tooltip", mergeResult, pointerPosition)
                    this.emittingMerge = true
                }
            } else {
                this.emittingMerge = false
            }
        } else {
            // Only reset tooltip if we're not over a character (to preserve character merge tooltips)
            const cell = this.scene.grid.worldToCell(pointer.x, pointer.y)
            const character = cell ? this.scene.playerTeam.getCreatureInCell(cell.col, cell.row) : null

            if (this.emittingMerge && !character) {
                this.resetTooltip()
            } else if (!character) {
                // Reset emittingMerge flag when not over any target
                this.emittingMerge = false
            }
        }
    }

    handleMouseEvents(): void {
        this.sprite.setInteractive({ useHandCursor: true })

        this.scene.input.setDraggable(this.sprite)

        this.scene.input.dragDistanceThreshold = 32 // pixels before drag starts (default ~16)
        this.scene.input.dragTimeThreshold = 40

        // this.sprite.on("pointerup", (pointer: Phaser.Input.Pointer) => {
        //     this.scene.availableItems.delete(this)
        //     this.sprite.destroy(true)
        //     this.scene.saveProgress()
        // })

        this.sprite.on("pointerover", (pointer: Phaser.Input.Pointer) => {
            this.showHoverBorder()

            this.emitTooltip(pointer)
        })

        this.sprite.on("pointerout", () => {
            // Items only ever live in the backpack or equipped to a creature, so
            // leaving hover always hides the highlight border.
            this.hideBorder()

            this.resetTooltip()
        })

        this.sprite.on("dragstart", () => {
            if (this.scene.state !== "idle") return

            this.showHoverBorder()

            this.preDrag = { x: this.sprite.x, y: this.sprite.y }

            // Set a very high depth to ensure the item is always on top
            this.sprite.setDepth(ITEM_DRAG_DEPTH)
            this.border.setDepth(ITEM_DRAG_BORDER_DEPTH)
        })

        this.sprite.on("drag", (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            this.sprite.setPosition(dragX, dragY)
            this.updateBorder()
            this.handleCreatureOnPoint(pointer)
            this.handleItemOnPoint(pointer)

            this.emitTooltip(pointer)
        })

        this.sprite.on("dragend", (pointer: Phaser.Input.Pointer) => {
            const character = this.handleCreatureOnPoint(pointer)
            if (character) {
                character.equipItem(this)
                this.hideBorder()
            } else {
                // Items are never left loose on the board: return them to the
                // backpack. Dropping straight onto the bag stores the item right away;
                // anywhere else makes it fly in from the point where it was released.
                const droppedOnBag = this.scene.inventoryBag?.blocksPoint(pointer.worldX, pointer.worldY) ?? false
                const deposit: ItemDeposit = droppedOnBag ? { animate: false } : { from: { x: this.sprite.x, y: this.sprite.y } }

                this.user?.unequipItem(this, false, deposit)
                this.scene.availableItems.add(this, deposit)
                this.scene.inventoryBag?.handleSlotDrop(this, pointer)
            }

            // The item kept its drag depth on purpose: `presentItem` below moves it
            // back to the layer that matches where it landed.
            this.scene.inventoryBag?.presentItem(this)
        })

        this.sprite.on("pointerup", () => {
            if (this.preDrag) {
                this.preDrag = undefined
                return
            }
        })

        this.sprite.once("destroy", () => {
            this.sprite.off("pointerover")
            this.sprite.off("pointerout")
            this.sprite.off("dragstart")
            this.sprite.off("drag")
            this.sprite.off("dragend")
            this.sprite.off("pointerup")
        })
    }

    emitTooltip(pointer: Phaser.Input.Pointer) {
        if (!this.emittingMerge) {
            const pointerPosition: PointerPosition = this.scene.grid.pointerToClient(pointer)
            EventBus.emit("item-tooltip", this, pointerPosition)
        }
    }

    resetTooltip() {
        this.emittingMerge = false
        Item.resetTooltip()
    }

    removeDragHandlers() {
        this.sprite.off("dragstart")
        this.sprite.off("drag")
        this.sprite.off("dragend")
        this.sprite.off("pointerup")
    }

    snapToCreature(creature: Creature) {
        if (creature.items.size === 3 && this.user !== creature) return

        this.sprite.setVisible(true)
        this.sprite.setScale(this.equiped_scale)
        this.syncPosition(creature, creature.boardX, creature.boardY)
        this.hideBorder()
        this.updateBorder()
        this.sprite.setRotation(0)
    }

    private resetSnap() {
        this.sprite.setScale(this.big_scale)
        this.showLooseBorder()
        this.updateBorder()
    }

    private emitMergeOutput(creature: Creature, pointer: Phaser.Input.Pointer) {
        const mergeResult = creature.getMergeResult(this)?.result
        if (mergeResult) {
            const pointerPosition: PointerPosition = this.scene.grid.pointerToClient(pointer)
            EventBus.emit("item-tooltip", mergeResult, pointerPosition)
            this.emittingMerge = true
        }
    }

    private handleCreatureOnPoint(pointer: Phaser.Input.Pointer) {
        // The backpack panel owns the pointer while it is over the panel area,
        // so creatures behind the panel are never highlighted or equipped.
        if (this.scene.inventoryBag?.blocksPoint(pointer.worldX, pointer.worldY)) return

        const x = pointer.x
        const y = pointer.y
        const cell = this.scene.grid.worldToCell(x, y)
        if (cell) {
            const character = this.scene.playerTeam.getCreatureInCell(cell.col, cell.row)
            if (character) {
                this.snapToCreature(character)
                this.emitMergeOutput(character, pointer)
                return character
            } else {
                this.resetSnap()
                this.resetTooltip()
            }
        }
    }

    /** Puts the item back into the backpack, hiding its in-world sprite. */
    store() {
        this.user = undefined
        this.sprite.clearMask()
        this.sprite.setVisible(false)
        this.sprite.setPosition(10000, 10000)
        this.hideBorder()
    }

    /**
     * Draws the item inside a backpack slot. The sprite is scaled down to fit
     * `maxSize` so items of different texture sizes look consistent, and moved to
     * the backpack layer so the panel never covers it.
     */
    showInSlot(x: number, y: number, maxSize: number, depth = ITEM_EQUIPPED_DEPTH) {
        const largest = Math.max(1, this.sprite.width, this.sprite.height)

        this.user = undefined
        this.sprite.setPosition(x, y)
        this.sprite.setScale(maxSize / largest)
        this.sprite.setRotation(0)
        this.sprite.setDepth(depth)
        this.sprite.setVisible(true)
        this.hideBorder()
    }

    syncPosition(creature: Creature, x = creature.x, y = creature.y) {
        let offsetX = creature.items.size

        if (this.user === creature) {
            offsetX = Array.from(creature.items.values()).indexOf(this)
        }

        this.sprite.setPosition(x - 16 + 16 * offsetX, y - 60)
        this.updateBorder()
    }
}
