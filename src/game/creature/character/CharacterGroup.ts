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
        this.replaceInBoard()
        EventBus.emit("characters-change", this.getChildren())
    }

    replaceInBoard() {
        const grid = (this.scene as Game).grid
        const characters = this.getChildren()
        if (!grid || characters.length === 0) return

        const cols = grid.cols
        const rows = grid.rows

        // Players: use bottom three rows centered (unchanged idea)
        const baseRows = [rows - 1, rows - 2, rows - 3].filter((r) => r >= 0)
        let idx = 0
        for (const row of baseRows) {
            const remaining = characters.length - idx
            if (remaining <= 0) break
            const take = Math.min(remaining, cols)
            const startCol = Math.floor((cols - take) / 2)
            for (let i = 0; i < take; i++) {
                const character = characters[idx++]
                const { x, y } = grid.cellToCenter(startCol + i, row)
                character.setPosition(x, y)
                character.body?.reset(x, y)
                character.reset()
            }
        }
    }
}
