import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { EventBus } from "../../tools/EventBus"
import { RNG } from "../../tools/RNG"
import { ItemRegistry } from "./ItemRegistry"

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

            this.sprite = scene.add.image(10000, 10000, texture) // spawnin g outside game canvas
            this.sprite.setScale(this.big_scale)
            this.sprite.setDepth(1000)

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
    applyModifier(creature: Creature) {}

    // each augment must override
    afterApplying(characters: Creature[]) {}

    // each augment must override
    cleanup(creature: Creature) {}

    private handleItemOnPoint(pointer: Phaser.Input.Pointer) {
        const x = Phaser.Math.Clamp(pointer.x, 0, this.scene.scale.width)
        const y = Phaser.Math.Clamp(pointer.y, 0, this.scene.scale.height)

        const targetItem = Array.from(this.scene.availableItems).find((item: Item) => {
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
            if (this.emittingMerge) {
                this.resetTooltip()
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
            if (!this.user) this.showLooseBorder() // back to 0.6 when loose
            else this.hideBorder()

            this.resetTooltip()
        })

        this.sprite.on("dragstart", (pointer: Phaser.Input.Pointer) => {
            if (this.scene.state !== "idle") return

            this.showHoverBorder()

            this.preDrag = { x: this.sprite.x, y: this.sprite.y }

            // Set a very high depth to ensure the item is always on top
            this.sprite.setDepth(9999)
            this.border.setDepth(10000)
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
                this.user?.unequipItem(this)
                this.showLooseBorder()
            }

            // Reset depth after dragging ends
            this.sprite.setDepth(1000)
            this.border.setDepth(1001)
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

    dropOnBoard() {
        let x = this.scene.background.x
        x += this.scene.background.x / 2

        this.sprite.setPosition(x, this.scene.background.y)
        this.drop()
    }

    drop() {
        this.user = undefined
        this.sprite.setVisible(true)

        // Calculate a random direction and distance for the drop
        const angle = Phaser.Math.Between(0, 360)
        const distance = Phaser.Math.Between(0, 100)
        const targetX = this.sprite.x + Math.cos(Phaser.Math.DegToRad(angle)) * distance
        const targetY = this.sprite.y + Math.sin(Phaser.Math.DegToRad(angle)) * distance

        // Set initial state (small and transparent)
        this.sprite.setScale(0.05)
        this.sprite.setAlpha(0.7)

        // Create a bounce effect with multiple tweens
        this.scene.tweens.chain({
            targets: this.sprite,
            tweens: [
                {
                    // First: move to random position with scale up
                    x: targetX,
                    y: targetY,
                    scale: 0.45, // Overshoot a bit
                    alpha: 1,
                    duration: 200,
                    ease: "Back.easeOut",
                    onComplete: () => {
                        // Second: slight bounce back
                        this.scene.tweens.add({
                            targets: this.sprite,
                            scale: this.big_scale,
                            duration: 100,
                            ease: "Bounce.easeOut",
                            onComplete: () => {
                                this.showLooseBorder()
                            },
                        })
                    },
                },
            ],
        })

        // Optional: add a slight rotation
        this.scene.tweens.add({
            targets: this.sprite,
            rotation: Phaser.Math.DegToRad(Phaser.Math.Between(-45, 45)),
            duration: 300,
            ease: "Sine.easeOut",
        })
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
