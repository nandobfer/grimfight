import Phaser from "phaser"
import type { BattleTimer } from "../systems/BattleTimer"
import type { Game } from "../scenes/Game"

/** Depth above the arena and creature UI so the readout is never covered. */
const hudDepth = 10000
/** Vertical position, in scene coordinates, above the arena's play area. */
const hudOffsetY = 40

/**
 * Battle timer readout drawn directly by the Phaser scene.
 *
 * The scene owns the timing rules; this HUD only projects the current timer
 * state into a text label, so the countdown numbers are rendered by the game
 * canvas instead of the React overlay.
 */
export class BattleTimerHud {
    private readonly label: Phaser.GameObjects.Text
    private lastText = ""
    private destroyed = false

    constructor(scene: Game) {
        this.label = scene.add
            .text(scene.cameras.main.width / 2, hudOffsetY, "", {
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "40px",
                color: "#f2eee3",
                stroke: "#000000",
                strokeThickness: 6,
                align: "center",
            })
            .setOrigin(0.5, 0.5)
            .setDepth(hudDepth)
            .setVisible(false)
    }

    /** Show the countdown, or the overtime multiplier, while a battle is running. */
    update(timer: BattleTimer) {
        if (this.destroyed) return

        if (!timer.isRunning) {
            this.hide()
            return
        }

        const text = timer.isExpired ? `${timer.overtimeSpeedMultiplier}×` : String(Math.ceil(timer.remainingMs / 1000))

        // Only touch the text object when the displayed value actually changes.
        if (this.label.visible && text === this.lastText) return

        this.lastText = text
        this.label.setText(text).setVisible(true)
    }

    hide() {
        if (this.destroyed || !this.label.visible) return
        this.lastText = ""
        this.label.setVisible(false)
    }

    destroy() {
        if (this.destroyed) return
        this.destroyed = true
        this.label.destroy()
    }
}
