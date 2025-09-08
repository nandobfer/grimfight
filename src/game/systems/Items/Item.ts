import { Creature } from "../../creature/Creature"
import { Game } from "../../scenes/Game"

const big_scale = 0.34
const equiped_scale = 0.17

export class Item {
    name: string
    description: string
    sprite: Phaser.GameObjects.Image
    scene: Game
    user?: Creature

    private glowFx: Phaser.FX.Glow
    private preDrag?: { x: number; y: number }

    constructor(scene: Game, texture: string) {
        this.scene = scene
        this.sprite = scene.add.image(10000, 10000, texture) // spawnin g outside game canvas
        this.sprite.setScale(big_scale)
        this.sprite.setDepth(1000)
        this.handleMouseEvents()
        scene.events.once('gameover', () => this.sprite.destroy(true))
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

        this.sprite.on("pointerover", () => {
            // if (this.scene.state === "idle") {
            // this.animateGlow(5)
            // }
        })

        this.sprite.on("pointerout", () => {
            // this.animateGlow(0)
        })

        this.sprite.on("dragstart", (pointer: Phaser.Input.Pointer) => {
            if (this.scene.state !== "idle") return

            console.log("dragstart")
            this.preDrag = { x: this.sprite.x, y: this.sprite.y }
        })

        this.sprite.on("drag", (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            if (this.scene.state !== "idle") return
            this.sprite.setPosition(dragX, dragY)

            this.handleCreatureOnPoint(dragX, dragY)
        })

        this.sprite.on("dragend", (pointer: Phaser.Input.Pointer) => {
            if (this.scene?.state !== "idle") return

            console.log("dragend")

            const character = this.handleCreatureOnPoint(pointer.worldX, pointer.worldY)
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

        this.sprite.setScale(equiped_scale)
        this.syncPosition(creature, creature.boardX, creature.boardY)
        this.animateGlow(0)
        this.sprite.setRotation(0)
    }

    private resetSnap() {
        this.sprite.setScale(big_scale)
        this.animateGlow(5)
    }

    private handleCreatureOnPoint(x: number, y: number) {
        const cell = this.scene.grid.worldToCell(x, y)
        if (cell) {
            const character = this.scene.playerTeam.getCreatureInCell(cell.col, cell.row)
            if (character) {
                this.snapToCreature(character)
                return character
            } else {
                this.resetSnap()
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
                            scale: big_scale,
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

        this.sprite.setPosition(x - 16 + 16 * offsetX, y - 36)
    }
}
