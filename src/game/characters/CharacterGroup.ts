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
        const grid = (this.scene as Game).grid
        const chars = this.getChildren()
        if (!grid || chars.length === 0) return

        const cols = grid.cols
        const rows = grid.rows

        // Players: use bottom three rows centered (unchanged idea)
        const baseRows = [rows - 1, rows - 2, rows - 3].filter((r) => r >= 0)
        let idx = 0
        for (const row of baseRows) {
            const remaining = chars.length - idx
            if (remaining <= 0) break
            const take = Math.min(remaining, cols)
            const startCol = Math.floor((cols - take) / 2)
            for (let i = 0; i < take; i++) {
                const c = chars[idx++]
                const { x, y } = grid.cellToCenter(startCol + i, row)
                c.setPosition(x, y)
                c.body?.reset(x, y)
                c.reset()
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
