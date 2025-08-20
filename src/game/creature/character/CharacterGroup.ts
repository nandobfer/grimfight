import { Game } from "../../scenes/Game"
import { DamageChart } from "../../tools/DamageChart"
import { CreatureGroup } from "../CreatureGroup"
import { Character } from "./Character"

export class CharacterGroup extends CreatureGroup {
    damageChart: DamageChart

    constructor(
        scene: Game,
        children?: Character[] | Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig,
        config?: (Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig) & { isPlayer?: boolean }
    ) {
        super(scene, children, config)
        this.damageChart = new DamageChart(this)
    }

    override getChildren() {
        return super.getChildren() as Character[]
    }

    reset() {
        super.reset()
        this.replaceInBoard()
    }

    replaceInBoard() {
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
}
