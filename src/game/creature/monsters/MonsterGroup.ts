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
        const grid = (this.scene as Game).grid
        const chars = this.getChildren()
        if (!grid || chars.length === 0) return

        const cols = grid.cols
        const rows = grid.rows

        // Enemies: map preferred row
        const front: Monster[] = []
        const mid: Monster[] = []
        const back: Monster[] = []
        for (const c of chars) {
            const pref = (c as any).preferredPosition as "front" | "middle" | "back" | undefined
            if (pref === "middle") mid.push(c)
            else if (pref === "back") back.push(c)
            else front.push(c)
        }
        const plan: Array<{ row: number; list: Monster[] }> = [
            { row: 0, list: front },
            { row: 1, list: mid },
            { row: 2, list: back },
        ]

        for (const { row, list } of plan) {
            const count = Math.min(list.length, cols)
            const startCol = Math.floor((cols - count) / 2)
            for (let i = 0; i < count; i++) {
                const c = list[i]
                const { x, y } = grid.cellToCenter(startCol + i, row)
                c.boardX = x
                c.boardY = y
                c.setPosition(x, y)
                c.body?.reset(x, y)
                c.reset()
            }
            // overflow wraps to the next rows downward if any:
            let idx = cols
            let r = row + 1
            while (idx < list.length && r < 3) {
                const left = Math.min(cols, list.length - idx)
                const start = Math.floor((cols - left) / 2)
                for (let j = 0; j < left; j++) {
                    const c = list[idx++]
                    const { x, y } = grid.cellToCenter(start + j, r)
                    c.boardX = x
                    c.boardY = y
                    c.setPosition(x, y)
                    c.body?.reset(x, y)
                    c.reset()
                }
                r++
            }
        }
    }
}
