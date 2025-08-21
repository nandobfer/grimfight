import { Game } from "../../scenes/Game"
import { DamageChart } from "../../tools/DamageChart"
import { EventBus } from "../../tools/EventBus"
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
        EventBus.emit("characters-change", this.getChildren())
    }

    add(child: Character, addToScene?: boolean): this {
        super.add(child, addToScene)

        const grid = this.scene.grid
        if (!grid) return this

        // bottom 3 rows for player
        const rows = [grid.rows - 1, grid.rows - 2, grid.rows - 3].filter((r) => r >= 0)

        const centeredCols = (n: number) => {
            const mid = Math.floor((n - 1) / 2)
            const out = [mid]
            for (let d = 1; out.length < n; d++) {
                if (mid + d < n) out.push(mid + d)
                if (mid - d >= 0) out.push(mid - d)
            }
            return out
        }
        const colOrder = centeredCols(grid.cols)

        outer: for (const row of rows) {
            for (const col of colOrder) {
                const { x, y } = grid.cellToCenter(col, row)
                // consider the cell taken if any character is at that cell center
                const taken = this.getChildren().some((c) => c !== child && c.boardX === x && c.boardY === y)
                if (!taken) {
                    child.boardX = x
                    child.boardY = y
                    child.setPosition(x, y)
                    child.body?.reset(x, y)
                    child.reset()
                    break outer
                }
            }
        }

        return this
    }
}
