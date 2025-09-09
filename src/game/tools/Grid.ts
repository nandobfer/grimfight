// src/game/grid/Grid.ts
import Phaser from "phaser"
import { Game } from "../scenes/Game"
import { Creature } from "../creature/Creature"

type Insets = { left: number; right: number; top: number; bottom: number }
export type PreferredPosition = "front" | "middle" | "back" // one of the 3 available rows. For enemies are the top 3, for player characters are the bottom 3

export class Grid {
    private scene: Game
    private arena: Phaser.GameObjects.Image
    private left!: number
    private top!: number
    private width!: number
    private height!: number
    cellW!: number
    cellH!: number
    cols!: number
    rows!: number
    private hi!: Phaser.GameObjects.Rectangle
    private insets: Insets
    private depthOverArena: number

    private overlay!: Phaser.GameObjects.Graphics
    private allowedRowStart!: number

    constructor(scene: Game, arena: Phaser.GameObjects.Image) {
        this.scene = scene
        this.arena = arena

        this.insets = { left: 130, right: 132, top: 160, bottom: 122 }
        this.depthOverArena = 1

        // set geometry
        const b = arena.getBounds() // world-space rect accounting for scale/pos
        const innerW = arena.displayWidth - this.insets.left - this.insets.right
        const innerH = arena.displayHeight - this.insets.top - this.insets.bottom
        this.width = innerW
        this.height = innerH
        this.left = b.left + this.insets.left
        this.top = b.top + this.insets.top

        // derive cols/rows from desired cell
        const cell = Math.max(1, 64)
        this.cols = Math.max(1, Math.floor(innerW / cell))
        this.rows = Math.max(1, Math.floor(innerH / cell))

        // make cells fill the inner rect exactly
        this.cellW = innerW / this.cols
        this.cellH = innerH / this.rows

        // highlight rectangle
        this.hi = scene.add
            .rectangle(0, 0, this.cellW, this.cellH)
            .setStrokeStyle(2, 0xffffff, 0.95)
            .setFillStyle(0xfff6a0, 0.15)
            .setVisible(false)
            .setDepth(arena.depth + this.depthOverArena)

        // overlay (all valid droppable cells)
        this.overlay = scene.add
            .graphics()
            .setDepth(arena.depth + this.depthOverArena)
            .setVisible(false)

        // bottom 3 rows are valid
        this.allowedRowStart = Math.max(0, this.rows - 3)
        this.redrawOverlay()
    }

    private redrawOverlay() {
        this.overlay.clear()
        this.overlay.fillStyle(0xfff2a6, 0.12)
        this.overlay.lineStyle(1, 0xffffff, 0.2)

        const inset = 10
        const w = this.cellW - inset
        const h = this.cellH - inset

        for (let row = this.allowedRowStart; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const { x, y } = this.cellToTopLeft(col, row)
                const rx = x + inset / 2
                const ry = y + inset / 2
                this.overlay.fillRect(rx, ry, w, h)
                this.overlay.strokeRect(rx, ry, w, h)
            }
        }
    }

    private cellToTopLeft(col: number, row: number) {
        const x = this.left + col * this.cellW
        const y = this.top + row * this.cellH
        return { x, y }
    }

    pointerToClient = (pointer: Phaser.Input.Pointer) => {
        const ev = pointer.event as PointerEvent
        return { x: ev.clientX, y: ev.clientY }
    }

    worldToReact(x: number, y: number) {
        const rect = this.scene.game.canvas.getBoundingClientRect()
        const cam = this.scene.cameras.main
        const sx = (x - cam.scrollX) * cam.zoom
        const sy = (y - cam.scrollY) * cam.zoom
        return { x: rect.left + sx, y: rect.top + sy }
    }

    worldToCell(wx: number, wy: number) {
        const col = Math.floor((wx - this.left) / this.cellW)
        const row = Math.floor((wy - this.top) / this.cellH)
        if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return null
        return { col, row }
    }

    cellToCenter(col: number, row: number) {
        const x = this.left + (col + 0.5) * this.cellW
        const y = this.top + (row + 0.5) * this.cellH
        return { x, y }
    }

    private isDroppableRow(row: number) {
        return row >= this.allowedRowStart
    }

    showHighlightAtWorld(wx: number, wy: number) {
        const cell = this.worldToCell(wx, wy)
        if (!cell || !this.isDroppableRow(cell.row)) {
            this.hi.setVisible(false)
            return null
        }
        const { x, y } = this.cellToCenter(cell.col, cell.row)
        this.hi.setPosition(x, y).setDisplaySize(this.cellW, this.cellH).setVisible(true)
        return cell
    }

    hideHighlight() {
        this.hi.setVisible(false)
    }

    snapCharacter(character: Creature, wx: number, wy: number) {
        const cell = this.worldToCell(wx, wy)
        if (!cell || !this.isDroppableRow(cell.row)) return false

        const { x, y } = this.cellToCenter(cell.col, cell.row)

        // If already in this cell, just snap to the exact center and update board coords
        const currentCell = character.boardX > 0 && character.boardY > 0 ? this.worldToCell(character.boardX, character.boardY) : null
        if (currentCell && currentCell.col === cell.col && currentCell.row === cell.row) {
            character.boardX = x
            character.boardY = y
            character.setPosition(x, y)
            character.body?.reset(x, y)
            return true
        }

        // Find any existing character at the destination cell
        const other =
            (this.scene.playerTeam as any).getCharacterInPosition?.(x, y) ??
            this.scene.playerTeam.getChildren().find((c: Creature) => c.boardX === x && c.boardY === y)

        if (other && other !== character) {
            // Swap positions if the dragged character had a valid previous cell
            if (character.boardX > 0 && character.boardY > 0) {
                const prevX = character.boardX
                const prevY = character.boardY

                // Move 'other' to our previous cell (update board + body)
                other.boardX = prevX
                other.boardY = prevY
                other.setPosition(prevX, prevY)
                other.body?.reset(prevX, prevY)
                other.reset()
            } else {
                // No previous valid cell for 'character' → simple move (no swap target)
                // (If you prefer to block the move in this case, return false here.)
            }
        }

        // Place dragged character at destination (update board + body)
        character.boardX = x
        character.boardY = y
        character.setPosition(x, y)
        character.body?.reset(x, y)
        character.reset()
        return true
    }

    hideDropOverlay() {
        this.overlay.setVisible(false)
    }

    showDropOverlay() {
        this.overlay.setVisible(true)
    }

    getBandForRow(row: number, side: "player" | "enemy"): PreferredPosition | null {
        if (row < 0 || row >= this.rows) return null

        if (side === "player") {
            // bottom 3 rows
            const front = this.rows - 3 // closest to enemies
            const middle = this.rows - 2
            const back = this.rows - 1 // farthest from enemies
            if (row === front) return "front"
            if (row === middle) return "middle"
            if (row === back) return "back"
            return null
        } else {
            // top 3 rows
            const back = 0 // farthest from players
            const middle = 1
            const front = 2 // closest to players
            if (row === front) return "front"
            if (row === middle) return "middle"
            if (row === back) return "back"
            return null
        }
    }
}
