/**
 * BattleTimer tracks the active-combat time of a single round and decides when
 * the battle should enter overtime.
 *
 * The class is intentionally free of any Phaser dependency so the timing rules
 * can be unit tested in a plain Node environment. The scene owns the instance,
 * feeds it the combat delta and reacts to the overtime transition.
 */

export interface BattleTimerOptions {
    /** Active-combat time, in milliseconds, before the battle enters overtime. */
    durationMs: number
    /** Game speed multiplier applied once the battle time runs out. */
    overtimeSpeedMultiplier: number
}

export interface BattleTimerSnapshot {
    /** Whether the countdown is currently running. */
    active: boolean
    /** Time left before overtime, clamped to zero once it is reached. */
    remainingMs: number
    /** Total configured active-combat time. */
    durationMs: number
    /** Effective speed multiplier for the current battle state. */
    speedMultiplier: number
    /** Whether the battle has already crossed into overtime. */
    expired: boolean
}

export const defaultBattleTimerOptions: BattleTimerOptions = {
    durationMs: 30_000,
    overtimeSpeedMultiplier: 2,
}

export class BattleTimer {
    private readonly options: BattleTimerOptions
    private accumulatedMs = 0
    private running = false
    private expired = false

    constructor(options: BattleTimerOptions = defaultBattleTimerOptions) {
        this.options = options
    }

    get durationMs(): number {
        return this.options.durationMs
    }

    get overtimeSpeedMultiplier(): number {
        return this.options.overtimeSpeedMultiplier
    }

    get isRunning(): boolean {
        return this.running
    }

    get isExpired(): boolean {
        return this.expired
    }

    /** Whether overtime is currently active (running and past the time limit). */
    get isOvertime(): boolean {
        return this.running && this.expired
    }

    get elapsedMs(): number {
        return this.accumulatedMs
    }

    get remainingMs(): number {
        return Math.max(0, this.options.durationMs - this.accumulatedMs)
    }

    /** Speed multiplier to apply to the battle right now. */
    get speedMultiplier(): number {
        return this.isOvertime ? this.options.overtimeSpeedMultiplier : 1
    }

    /** Begin (or restart) the countdown from a clean state. */
    start(): void {
        this.accumulatedMs = 0
        this.expired = false
        this.running = true
    }

    /**
     * Stop counting without clearing state, so the outcome (for example whether
     * the battle finished within the time limit) can still be inspected.
     */
    stop(): void {
        this.running = false
    }

    /** Stop and clear elapsed/expired state entirely. */
    reset(): void {
        this.running = false
        this.expired = false
        this.accumulatedMs = 0
    }

    /**
     * Advance active-combat time. Time is only counted while running and before
     * the limit is reached.
     *
     * @returns true on the tick that crosses into overtime.
     */
    tick(deltaMs: number): boolean {
        if (!this.running || this.expired) return false
        if (!Number.isFinite(deltaMs) || deltaMs <= 0) return false

        this.accumulatedMs += deltaMs

        if (this.accumulatedMs >= this.options.durationMs) {
            this.expired = true
            return true
        }

        return false
    }

    snapshot(): BattleTimerSnapshot {
        return {
            active: this.isRunning,
            remainingMs: this.remainingMs,
            durationMs: this.durationMs,
            speedMultiplier: this.speedMultiplier,
            expired: this.expired,
        }
    }
}
