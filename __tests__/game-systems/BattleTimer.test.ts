import { describe, expect, it } from "vitest"
import { BattleTimer, defaultBattleTimerOptions } from "../../src/game/systems/BattleTimer"

const options = { durationMs: 1_000, overtimeSpeedMultiplier: 3 }

function makeTimer() {
    return new BattleTimer(options)
}

describe("BattleTimer", () => {
    it("starts idle with a full countdown", () => {
        const timer = makeTimer()

        expect(timer.isRunning).toBe(false)
        expect(timer.isExpired).toBe(false)
        expect(timer.remainingMs).toBe(options.durationMs)
        expect(timer.speedMultiplier).toBe(1)
    })

    it("only counts time while running", () => {
        const timer = makeTimer()

        expect(timer.tick(options.durationMs)).toBe(false)
        expect(timer.elapsedMs).toBe(0)

        timer.start()
        timer.tick(options.durationMs / 2)
        expect(timer.elapsedMs).toBe(options.durationMs / 2)

        timer.stop()
        timer.tick(options.durationMs / 2)
        expect(timer.elapsedMs).toBe(options.durationMs / 2)
    })

    it("crosses into overtime exactly once and reports the configured multiplier", () => {
        const timer = makeTimer()
        timer.start()

        expect(timer.tick(options.durationMs / 2)).toBe(false)
        expect(timer.isExpired).toBe(false)
        expect(timer.speedMultiplier).toBe(1)

        // This tick reaches the limit and must trip overtime.
        expect(timer.tick(options.durationMs / 2)).toBe(true)
        expect(timer.isExpired).toBe(true)
        expect(timer.isOvertime).toBe(true)
        expect(timer.speedMultiplier).toBe(options.overtimeSpeedMultiplier)

        // Further ticks stay in overtime without re-reporting the transition.
        expect(timer.tick(options.durationMs)).toBe(false)
        expect(timer.isExpired).toBe(true)
    })

    it("treats a single tick that overshoots the limit as reaching the limit", () => {
        const timer = makeTimer()
        timer.start()

        expect(timer.tick(options.durationMs + options.durationMs)).toBe(true)
        expect(timer.remainingMs).toBe(0)
        expect(timer.isExpired).toBe(true)
    })

    it("returns the speed to normal when stopped while keeping the expiry outcome", () => {
        const timer = makeTimer()
        timer.start()
        timer.tick(options.durationMs)

        expect(timer.isExpired).toBe(true)

        timer.stop()
        expect(timer.isRunning).toBe(false)
        expect(timer.isOvertime).toBe(false)
        expect(timer.speedMultiplier).toBe(1)
        // The outcome is still inspectable after stopping.
        expect(timer.isExpired).toBe(true)
    })

    it("restarts from a clean state on start", () => {
        const timer = makeTimer()
        timer.start()
        timer.tick(options.durationMs)
        expect(timer.isExpired).toBe(true)

        timer.start()
        expect(timer.isRunning).toBe(true)
        expect(timer.isExpired).toBe(false)
        expect(timer.elapsedMs).toBe(0)
        expect(timer.remainingMs).toBe(options.durationMs)
        expect(timer.speedMultiplier).toBe(1)
    })

    it("clears all state on reset", () => {
        const timer = makeTimer()
        timer.start()
        timer.tick(options.durationMs)

        timer.reset()
        expect(timer.isRunning).toBe(false)
        expect(timer.isExpired).toBe(false)
        expect(timer.elapsedMs).toBe(0)
        expect(timer.remainingMs).toBe(options.durationMs)
        expect(timer.speedMultiplier).toBe(1)
    })

    it("ignores non-positive and non-finite deltas", () => {
        const timer = makeTimer()
        timer.start()

        expect(timer.tick(0)).toBe(false)
        expect(timer.tick(-100)).toBe(false)
        expect(timer.tick(Number.NaN)).toBe(false)
        expect(timer.tick(Number.POSITIVE_INFINITY)).toBe(false)
        expect(timer.elapsedMs).toBe(0)
        expect(timer.isExpired).toBe(false)
    })

    it("exposes a snapshot that mirrors the current state", () => {
        const timer = makeTimer()
        timer.start()
        timer.tick(options.durationMs)

        const snapshot = timer.snapshot()
        expect(snapshot.active).toBe(true)
        expect(snapshot.expired).toBe(true)
        expect(snapshot.durationMs).toBe(options.durationMs)
        expect(snapshot.remainingMs).toBe(0)
        expect(snapshot.speedMultiplier).toBe(options.overtimeSpeedMultiplier)
    })

    it("ships a sane default configuration", () => {
        expect(defaultBattleTimerOptions.durationMs).toBeGreaterThan(0)
        expect(defaultBattleTimerOptions.overtimeSpeedMultiplier).toBeGreaterThan(1)
    })
})
