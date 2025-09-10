import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"
import { EventBus } from "../../tools/EventBus"
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

    private glowFx: Phaser.FX.Glow
    private preDrag?: { x: number; y: number }

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
                this.mergeResultCache.set(result, ItemRegistry.create(result, scene))
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
                this.big_scale *= 2
            }

            this.sprite = scene.add.image(10000, 10000, texture) // spawnin g outside game canvas
            this.sprite.setScale(this.big_scale)
            this.sprite.setDepth(1000)
            this.handleMouseEvents()
            scene.events.once("gameover", () => this.sprite.destroy(true))
        }
    }

    // each augment must override
    applyModifier(creature: Creature) {}

    // each augment must override
    afterApplying(characters: Creature[]) {}

    // each augment must override
    cleanup(creature: Creature) {}

    handleMouseEvents(): void {
        this.sprite.setInteractive({ useHandCursor: true })

        this.glowFx = this.sprite.postFX.addGlow(0xffffff, 5, 0) // White glow
        // this.glowFx.outerStrength = 0

        this.scene.input.setDraggable(this.sprite)

        this.scene.input.dragDistanceThreshold = 32 // pixels before drag starts (default ~16)
        this.scene.input.dragTimeThreshold = 40

        this.sprite.on("pointerover", (pointer: Phaser.Input.Pointer) => {
            if (this.user) {
                this.animateGlow(2)
            }

            const pointerPosition: PointerPosition = this.scene.grid.pointerToClient(pointer)

            EventBus.emit("item-tooltip", this, pointerPosition)
        })

        this.sprite.on("pointerout", () => {
            if (this.user) {
                this.animateGlow(0)
            }

            Item.resetTooltip()
        })

        this.sprite.on("dragstart", (pointer: Phaser.Input.Pointer) => {
            if (this.scene.state !== "idle") return

            console.log("dragstart")
            this.preDrag = { x: this.sprite.x, y: this.sprite.y }
            Item.resetTooltip()
        })

        this.sprite.on("drag", (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            // if (this.scene.state !== "idle") return
            this.sprite.setPosition(dragX, dragY)

            this.handleCreatureOnPoint(pointer)
        })

        this.sprite.on("dragend", (pointer: Phaser.Input.Pointer) => {
            // if (this.scene?.state !== "idle") return

            console.log("dragend")

            const character = this.handleCreatureOnPoint(pointer)
            if (character) {
                character.equipItem(this)
            } else {
                this.user?.unequipItem(this)
            }
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

    removeDragHandlers() {
        this.sprite.off("dragstart")
        this.sprite.off("drag")
        this.sprite.off("dragend")
        this.sprite.off("pointerup")
    }

    private animateGlow(targetStrength: number) {
        if (!this.glowFx) return

        this.scene.tweens.add({
            targets: this.glowFx,
            outerStrength: targetStrength,
            duration: 250, // Animation duration (ms)
            ease: "Sine.easeOut", // Smooth easing
        })
    }

    snapToCreature(creature: Creature) {
        if (creature.items.size === 3 && this.user !== creature) return

        this.sprite.setScale(this.equiped_scale)
        this.syncPosition(creature, creature.boardX, creature.boardY)
        this.animateGlow(0)
        this.sprite.setRotation(0)
    }

    private resetSnap() {
        this.sprite.setScale(this.big_scale)
        this.animateGlow(5)
    }

    private emitMergeOutput(creature: Creature, pointer: Phaser.Input.Pointer) {
        const mergeResult = creature.getMergeResult(this)?.result
        if (mergeResult) {
            const pointerPosition: PointerPosition = this.scene.grid.pointerToClient(pointer)

            EventBus.emit("item-tooltip", mergeResult, pointerPosition)
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
                Item.resetTooltip()
            }
        }
    }

    dropOnBoard() {
        this.sprite.setPosition(this.scene.background.x, this.scene.background.y)
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

        // Reset glow
        this.animateGlow(5)
    }

    syncPosition(creature: Creature, x = creature.x, y = creature.y) {
        let offsetX = creature.items.size

        if (this.user === creature) {
            offsetX = Array.from(creature.items.values()).indexOf(this)
        }

        this.sprite.setPosition(x - 16 + 16 * offsetX, y - 40)
    }
}
