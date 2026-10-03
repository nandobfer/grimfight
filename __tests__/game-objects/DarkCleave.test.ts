import { EventEmitter } from "node:events"
import { describe, expect, it, vi } from "vitest"
import type { Creature } from "../../src/game/creature/Creature"
import type { Game } from "../../src/game/scenes/Game"

vi.mock("phaser", () => ({ default: { Scenes: { Events: { POST_UPDATE: "postupdate", SHUTDOWN: "shutdown" } } } }))
vi.mock("../../src/game/objects/Projectile/Projectile", () => ({
    Projectile: class extends EventEmitter {
        active = false
        rotation = 0
        alreadyOverlaped = new Set()
        colliders = [{ destroy: vi.fn() }]
        body = { setVelocity: vi.fn() }
        constructor(public scene: Game, public x: number, public y: number, public owner: Creature) { super() }
        setScale() { return this }
        setOrigin() { return this }
        setRotation(value: number) { this.rotation = value; return this }
        resetPipeline() { return this }
        setActive(value: boolean) { this.active = value; return this }
        setVisible() { return this }
        setPosition(x: number, y: number) { this.x = x; this.y = y; return this }
        destroy() { this.active = false; this.emit("destroy") }
    },
}))

import { DarkCleave } from "../../src/game/objects/Projectile/DarkCleave"

function makeEnemy(x: number) {
    return Object.assign(new EventEmitter(), { x, y: 14, active: true, canBeTargeted: true, takeDamage: vi.fn() })
}

function setup() {
    const primary = makeEnemy(60)
    const second = makeEnemy(120)
    const minion = makeEnemy(180)
    const behindWall = makeEnemy(250)
    const timer = { remove: vi.fn() }
    const scene = {
        state: "fighting",
        walls: { getChildren: () => [{ body: { left: 220, right: 240, top: -100, bottom: 100 } }] },
        events: { on: vi.fn(), once: vi.fn(), off: vi.fn() },
        time: { delayedCall: vi.fn(() => timer) },
        perRoundFx: { add: vi.fn() },
    }
    const owner = Object.assign(new EventEmitter(), {
        active: true,
        attackDamage: 30,
        calculateDamage: vi.fn((damage: number) => ({ value: damage, crit: false })),
        onHit: vi.fn(),
        getEnemyTeam: () => ({ getChildren: () => [primary, second, behindWall], minions: { getChildren: () => [minion] } }),
    })
    const slash = new DarkCleave(scene as unknown as Game, owner as unknown as Creature, { x: 0, y: 0 }, 0, 1)
    const update = scene.events.on.mock.calls[0][1] as () => void
    const move = (x: number) => { slash.x = x; update.call(slash) }
    return { slash, move, owner, primary, second, minion, behindWall, timer, scene }
}

describe("DarkCleave flight", () => {
    it("pierces once per enemy and continues after the original target dies", () => {
        const { move, slash, primary, second, minion, owner } = setup()
        primary.takeDamage.mockImplementation(() => { primary.active = false; primary.emit("died") })
        move(80)
        expect(primary.takeDamage).toHaveBeenCalledOnce()
        expect(slash.active).toBe(true)
        move(140)
        move(150)
        expect(second.takeDamage).toHaveBeenCalledOnce()
        move(185)
        expect(minion.takeDamage).toHaveBeenCalledOnce()
        expect(owner.onHit).toHaveBeenCalledTimes(3)
    })

    it("sweeps a long frame up to the first wall without hitting enemies beyond it", () => {
        const { move, slash, primary, second, minion, behindWall, timer, scene } = setup()
        move(400)
        for (const enemy of [primary, second, minion]) expect(enemy.takeDamage).toHaveBeenCalledOnce()
        expect(behindWall.takeDamage).not.toHaveBeenCalled()
        expect(slash.active).toBe(false)
        expect(timer.remove).toHaveBeenCalledWith(false)
        expect(scene.events.off).toHaveBeenCalledWith("postupdate", expect.any(Function), slash)
    })

    it("cleans the flight when its owner dies or combat ends", () => {
        const first = setup()
        first.owner.emit("died")
        expect(first.slash.active).toBe(false)
        expect(first.owner.listenerCount("destroy")).toBe(0)
        expect(first.timer.remove).toHaveBeenCalledOnce()

        const second = setup()
        second.scene.state = "idle"
        second.move(80)
        expect(second.slash.active).toBe(false)
        expect(second.primary.takeDamage).not.toHaveBeenCalled()
    })

    it("does not let the generous hit radius reach through a wall before physical contact", () => {
        const { move, slash, behindWall } = setup()
        behindWall.x = 225
        move(205)
        expect(slash.active).toBe(true)
        expect(behindWall.takeDamage).not.toHaveBeenCalled()
    })
})
