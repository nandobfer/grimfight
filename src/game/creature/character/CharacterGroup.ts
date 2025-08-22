import { Game } from "../../scenes/Game"
import { DamageChart } from "../../tools/DamageChart"
import { EventBus } from "../../tools/EventBus"
import { CreatureGroup } from "../CreatureGroup"
import { Character } from "./Character"
import { CharacterStore } from "./CharacterStore"

export class CharacterGroup extends CreatureGroup {
    damageChart: DamageChart
    store: CharacterStore

    constructor(
        scene: Game,
        children?: Character[] | Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig,
        config?: (Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig) & { isPlayer?: boolean }
    ) {
        super(scene, children, config)
        this.damageChart = new DamageChart(this)
        this.store = new CharacterStore(this)
    }

    override getChildren() {
        return super.getChildren() as Character[]
    }

    getById(id: string) {
        return this.getChildren().find((character) => character.id === id)
    }

    reset() {
        super.reset()
        this.damageChart.reset()
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

        this.reset()
        this.tryMerge(child)
        child.saveInStorage()

        return this
    }

    getMatchingCharacters(name: string, level: number) {
        return this.getChildren().filter((character) => character.name === name && character.level === level)
    }

    private tryMerge(pivot: Character, guard = 0) {
        // Prevent accidental infinite chains
        if (guard > 8) return

        const name = pivot.name
        const level = pivot.level
        const matches = this.getMatchingCharacters(name, level)

        if (matches.length < 3) return

        // Keep the pivot; take any 2 others as donors
        const keep = pivot
        const donors = matches.filter((c) => c !== keep).slice(0, 2)

        // Basic merge animation, then destroy donors and level up the keeper
        this.mergeTriplet(keep, donors, () => {
            // After leveling up, try chaining (maybe we now have 3 of the next level)
            this.tryMerge(keep, guard + 1)
        })
    }

    /**
     * Animate donors moving into `keep`, then destroy donors and level up `keep`.
     * Very small, self-contained, and doesn’t reposition anyone else.
     */
    private mergeTriplet(keep: Character, donors: Character[], onComplete?: () => void) {
        const scene = this.scene as Game

        // Disable interactions during merge
        const disable = (c: Character) => {
            c.disableInteractive()
            scene.input.setDraggable(c, false)
        }
        const enable = (c: Character) => {
            c.setInteractive({ useHandCursor: true })
            scene.input.setDraggable(c, true)
        }

        disable(keep)
        donors.forEach(disable)

        // Simple tween helper
        const tweenToKeep = (donor: Character, delay: number) => {
            scene.tweens.add({
                targets: donor,
                x: keep.x,
                y: keep.y,
                scale: { from: donor.scale, to: donor.scale * 0.85 },
                alpha: { from: 1, to: 0 },
                duration: 350,
                delay,
                ease: "Sine.easeInOut",
                onComplete: () => {
                    // destroy donor after reaching the keeper
                    this.scene.savePlayerCharacters(this.getChildren().filter((item) => item.id !== donor.id))
                    donor.destroy(true)
                    doneOne()
                },
            })
        }

        let remaining = donors.length
        const doneOne = () => {
            remaining -= 1
            if (remaining === 0) {
                // Pop effect on the keeper, then level up
                scene.tweens.add({
                    targets: keep,
                    scale: { from: keep.scale, to: keep.scale * 1.08 },
                    duration: 160,
                    yoyo: true,
                    ease: "Sine.easeOut",
                    onComplete: () => {
                        keep.levelUp()
                        enable(keep)
                        keep.saveInStorage()
                        EventBus.emit("characters-change", this.getChildren())
                        onComplete?.()
                    },
                })
            }
        }

        // Start donors’ animations (slightly staggered)
        donors.forEach((donor, index) => tweenToKeep(donor, index * 80))
    }

    grantFloorReward(floor: number) {
        const gold = 3 + Math.round(floor * 0.5)
        this.scene.changePlayerGold(this.scene.playerGold + gold)
        this.store.shuffle()
    }
}
