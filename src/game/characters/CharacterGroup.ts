// src/game/characters/CharacterGroup.ts

import { Game } from "../scenes/Game"
import { DamageChart } from "../tools/DamageChart"
import { Character } from "./Character"

export class CharacterGroup extends Phaser.GameObjects.Group {
    isPlayer: boolean = false
    damageChart: DamageChart
    declare scene: Game

    constructor(
        scene: Game,
        children?: Character[] | Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig,
        config?: (Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig) & { isPlayer?: boolean }
    ) {
        super(scene, children, config)
        scene.add.existing(this)
        this.runChildUpdate = true
        this.isPlayer = !!config?.isPlayer
        if (this.isPlayer) {
            this.setChildrenPlayer()
        }
        this.resetMouseEvents()
        this.damageChart = new DamageChart(this)
    }

    override getChildren() {
        return super.getChildren() as Character[]
    }

    add(child: Character, addToScene?: boolean): this {
        super.add(child, addToScene)
        if (this.isPlayer) {
            child.isPlayer = true
            child.resetMouseEvents()
        }

        child.team = this

        return this
    }

    private setChildrenPlayer() {
        const characters = this.getChildren()
        for (const character of characters) {
            character.isPlayer = true
            character.team = this
        }
    }

    private resetMouseEvents() {
        const characters = this.getChildren()
        for (const character of characters) {
            character.resetMouseEvents()
        }
    }

    reset() {
        const grid = this.scene.grid
        const characters = this.getChildren()
        if (!grid || characters.length === 0) return

        const cols = grid.cols
        const rows = grid.rows

        // Prefer bottom 3 for player, top 3 for enemy
        const baseRows = this.isPlayer ? [rows - 1, rows - 2, rows - 3] : [0, 1, 2]

        // Keep only valid rows
        let rowsOrder = baseRows.filter((r) => r >= 0 && r < rows)

        // If more units than slots, add additional rows outward until enough (optional but safe)
        while (rowsOrder.length * cols < characters.length) {
            const next = this.isPlayer ? Math.min(...rowsOrder) - 1 : Math.max(...rowsOrder) + 1
            if (next < 0 || next >= rows) break
            rowsOrder.push(next)
        }

        // How many per row (row-major), then center them horizontally
        const perRow: number[] = []
        {
            let remaining = characters.length
            for (let i = 0; i < rowsOrder.length && remaining > 0; i++) {
                const take = Math.min(remaining, cols)
                perRow.push(take)
                remaining -= take
            }
        }

        // Place
        let idx = 0
        for (let i = 0; i < perRow.length; i++) {
            const row = rowsOrder[i]
            const count = perRow[i]
            const startCol = Math.floor((cols - count) / 2) // center this row’s group

            for (let j = 0; j < count; j++) {
                const col = startCol + j
                const { x, y } = grid.cellToCenter(col, row)
                const c = characters[idx++]

                c.setPosition(x, y)
                c.body?.reset(x, y)

                c.reset() // HP/mana/ui/etc
            }
        }
    }

    clear(removeFromScene?: boolean, destroyChild?: boolean) {
        const characters = this.getChildren()
        for (const character of characters) {
            character.destroyUi()
        }
        super.clear(removeFromScene, destroyChild)

        return this
    }

    getCharacterInPosition(x: number, y: number) {
        const characters = this.getChildren()
        return characters.find((char) => char.x === x && char.y === y)
    }
}
