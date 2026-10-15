import { describe, expect, it, vi } from "vitest"
import { BattleTimer } from "../../src/game/systems/BattleTimer"
import { BattleTimerHud } from "../../src/game/ui/BattleTimerHud"

// The HUD is a Phaser class; the timing rules come from the Phaser-free
// BattleTimer. Phaser is stubbed so the presentation can be tested in Node.
vi.mock("phaser", () => ({ default: {} }))

interface FakeText {
    visible: boolean
    value: string
    setOrigin: ReturnType<typeof vi.fn>
    setDepth: ReturnType<typeof vi.fn>
    setVisible: ReturnType<typeof vi.fn>
    setText: ReturnType<typeof vi.fn>
    destroy: ReturnType<typeof vi.fn>
}

function makeFakeText(): FakeText {
    const text = {
        visible: false,
        value: "",
        setOrigin: vi.fn(() => text),
        setDepth: vi.fn(() => text),
        setVisible: vi.fn((visible: boolean) => {
            text.visible = visible
            return text
        }),
        setText: vi.fn((value: string) => {
            text.value = value
            return text
        }),
        destroy: vi.fn(),
    }
    return text as FakeText
}

function makeScene() {
    const text = makeFakeText()
    const scene = {
        add: { text: vi.fn(() => text) },
        cameras: { main: { width: 768 } },
    }
    return { scene, text }
}

function makeTimer(durationMs = 30_000) {
    const timer = new BattleTimer({ durationMs, overtimeSpeedMultiplier: 2 })
    timer.start()
    return timer
}

describe("BattleTimerHud", () => {
    it("creates a hidden text label in the scene", () => {
        const { scene, text } = makeScene()

        new BattleTimerHud(scene as never)

        expect(scene.add.text).toHaveBeenCalledOnce()
        expect(text.setVisible).toHaveBeenCalledWith(false)
        expect(text.visible).toBe(false)
    })

    it("shows the remaining whole seconds while a battle is running", () => {
        const { scene, text } = makeScene()
        const hud = new BattleTimerHud(scene as never)

        hud.update(makeTimer(30_000))

        expect(text.visible).toBe(true)
        expect(text.value).toBe("30")
    })

    it("rounds the remaining time up and never goes negative", () => {
        const { scene, text } = makeScene()
        const hud = new BattleTimerHud(scene as never)
        const timer = makeTimer(10_000)

        timer.tick(9_001)
        hud.update(timer)
        expect(text.value).toBe("1")
    })

    it("skips redundant updates while the displayed second is unchanged", () => {
        const { scene, text } = makeScene()
        const hud = new BattleTimerHud(scene as never)
        const timer = makeTimer(30_000)

        hud.update(timer)
        const callsAfterFirstDraw = text.setText.mock.calls.length

        timer.tick(100)
        hud.update(timer)
        expect(text.setText.mock.calls.length).toBe(callsAfterFirstDraw)

        timer.tick(1_000)
        hud.update(timer)
        expect(text.setText.mock.calls.length).toBe(callsAfterFirstDraw + 1)
    })

    it("switches to the overtime multiplier once the time runs out", () => {
        const { scene, text } = makeScene()
        const hud = new BattleTimerHud(scene as never)
        const timer = makeTimer(30_000)

        timer.tick(30_000)
        hud.update(timer)

        expect(text.visible).toBe(true)
        expect(text.value).toBe("2×")
    })

    it("hides the label when the battle is no longer running", () => {
        const { scene, text } = makeScene()
        const hud = new BattleTimerHud(scene as never)
        const timer = makeTimer()

        hud.update(timer)
        expect(text.visible).toBe(true)

        timer.stop()
        hud.update(timer)
        expect(text.visible).toBe(false)
    })

    it("does not touch the text object while already hidden", () => {
        const { scene, text } = makeScene()
        const hud = new BattleTimerHud(scene as never)
        const timer = new BattleTimer({ durationMs: 30_000, overtimeSpeedMultiplier: 2 })

        hud.update(timer)
        hud.update(timer)

        // setVisible(false) once from the constructor, never again.
        expect(text.setVisible).toHaveBeenCalledTimes(1)
        expect(text.setText).not.toHaveBeenCalled()
    })

    it("redraws after being hidden and shown again", () => {
        const { scene, text } = makeScene()
        const hud = new BattleTimerHud(scene as never)
        const timer = makeTimer(30_000)

        hud.update(timer)
        timer.stop()
        hud.update(timer)

        timer.start()
        hud.update(timer)

        expect(text.visible).toBe(true)
        expect(text.value).toBe("30")
    })

    it("destroys its text object", () => {
        const { scene, text } = makeScene()
        const hud = new BattleTimerHud(scene as never)

        hud.destroy()

        expect(text.destroy).toHaveBeenCalledOnce()
    })

    it("stops touching the text object after being destroyed", () => {
        const { scene, text } = makeScene()
        const hud = new BattleTimerHud(scene as never)

        hud.destroy()
        hud.destroy()
        hud.update(makeTimer())
        hud.hide()

        expect(text.destroy).toHaveBeenCalledOnce()
        expect(text.setText).not.toHaveBeenCalled()
        expect(text.setVisible).toHaveBeenCalledTimes(1)
    })
})
