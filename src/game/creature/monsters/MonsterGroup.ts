import { Game } from "../../scenes/Game"
import { CreatureGroup } from "../CreatureGroup"
import { Monster } from "./Monster"

export class MonsterGroup extends CreatureGroup {
    constructor(
        scene: Game,
        children?: Monster[] | Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig,
        config?: (Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig) & { isPlayer?: boolean }
    ) {
        super(scene, children, config)
    }

    override getChildren() {
        return super.getChildren() as Monster[]
    }

    reset() {
        super.reset()
        this.replaceInBoard()
    }

    replaceInBoard() {
        const grid = (this.scene as Game).grid
        const monsters = this.getChildren() as Monster[]
        if (!grid || monsters.length === 0) return
        const cols = grid.cols

        // Buckets
        const front: Monster[] = []
        const mid: Monster[] = []
        const back: Monster[] = []
        for (const c of monsters) {
            const pref = (c as any).preferredPosition as "front" | "middle" | "back" | undefined
            if (pref === "middle") mid.push(c)
            else if (pref === "back") back.push(c)
            else front.push(c)
        }

        // FRONT is the row closest to the player (row 2), then middle (1), then back (0)
        const plan: Array<{ row: number; list: Monster[] }> = [
            { row: 2, list: front },
            { row: 1, list: mid },
            { row: 0, list: back },
        ]

        for (const { row, list } of plan) {
            const count = Math.min(list.length, cols)
            const startCol = Math.floor((cols - count) / 2)

            // primary row
            for (let i = 0; i < count; i++) {
                const monster = list[i]
                const { x, y } = grid.cellToCenter(startCol + i, row - 1)
                monster.boardX = x
                monster.boardY = y
                monster.setPosition(x, y)
                monster.body.reset(x, y)
            }

            // overflow wraps toward the BACK (upwards), never into player's rows
            let idx = cols
            let currentRow = row - 1
            while (idx < list.length && currentRow >= 0) {
                const left = Math.min(cols, list.length - idx)
                const start = Math.floor((cols - left) / 2)
                for (let j = 0; j < left; j++) {
                    const monster = list[idx++]
                    const { x, y } = grid.cellToCenter(start + j, currentRow)
                    monster.boardX = x
                    monster.boardY = y
                    monster.setPosition(x, y)
                    monster.body.reset(x, y)
                }
                currentRow--
            }
        }
    }
}
