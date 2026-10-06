import { afterAll, describe, expect, it, vi } from "vitest"
import type { Game } from "../../src/game/scenes/Game"
import type { Creature } from "../../src/game/creature/Creature"
import { SAULO_GAS_CLOUD_DURATION_MS, SAULO_GAS_EMIT_INTERVAL_MS } from "../../src/game/creature/classes/SauloPoisonGas"

vi.mock("../../src/game/creature/character/Character", async () => {
    const { EventEmitter } = await import("node:events")
    return { Character: class extends EventEmitter {
        x = 100
        y = 75
        scaleX = 1
        scaleY = 1
        displayOriginX = 10
        displayOriginY = 20
        speed = 110
        active = true
        health = 100
        moveLocked = false
        frozen = false
        facing = "right"
        depth = 1
        target?: Creature
        body = { offset: { x: 0, y: 0 }, width: 20, height: 20, velocity: { x: 0, y: 0 },
            reset: (x: number, y: number) => { this.x = x; this.y = y; this.body.velocity = { x: 0, y: 0 } } }
        constructor(public scene: Game) { super() }
        getEnemyTeam() { return this.scene.enemyTeam }
        getFartestEnemy() { return this.scene.enemyTeam.getChildren()[0] }
        getAnimationTextureName() { return "saulo" }
        play() { return this }
        stopMoving() { this.body.velocity = { x: 0, y: 0 } }
        idle() {}
        updateFacingDirection() {}
        update() { this.withTargetUpdate() }
        withTargetUpdate() {}
    } }
})
vi.mock("../../src/game/objects/StatusEffect/Dot", () => ({ Dot: class { start() {} } }))
vi.mock("../../src/game/objects/StatusEffect/Hot", () => ({ Hot: class {} }))

import { Saulo } from "../../src/game/creature/classes/Saulo"

vi.stubGlobal("Phaser", {
    Math: {
        FloatBetween: () => 0,
        Clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)),
        RadToDeg: (value: number) => value * 180 / Math.PI,
        Angle: { Between: (x: number, y: number, tx: number, ty: number) => Math.atan2(ty - y, tx - x) },
        Distance: { Between: (x: number, y: number, tx: number, ty: number) => Math.hypot(tx - x, ty - y) },
    },
    Physics: { Arcade: { StaticBody: class {} } },
    BlendModes: { ADD: 1 },
})
afterAll(() => vi.unstubAllGlobals())

function setup() {
    const enemy = { active: true, canBeTargeted: true, x: 60, y: 75, target: undefined as unknown }
    const graphic = { active: true, scene: {}, setDepth: vi.fn().mockReturnThis(), setBlendMode: vi.fn().mockReturnThis(),
        clear: vi.fn(), fillStyle: vi.fn(), fillEllipse: vi.fn(), fillCircle: vi.fn(), destroy: vi.fn() }
    const scene = {
        state: "fighting", enemyTeam: { getChildren: () => [enemy] }, walls: { getChildren: () => [] },
        grid: { cellW: 50, cellH: 50, cols: 4, rows: 3, cellToCenter: () => ({ x: 25, y: 25 }) },
        physics: { velocityFromAngle: (degrees: number, speed: number, velocity: { x: number; y: number }) => {
            velocity.x = Math.cos(degrees * Math.PI / 180) * speed
            velocity.y = Math.sin(degrees * Math.PI / 180) * speed
        } },
        add: { graphics: () => graphic }, perRoundFx: { add: vi.fn(), remove: vi.fn() },
    }
    const saulo = new Saulo(scene as unknown as Game, "test")
    saulo.target = enemy as unknown as Creature
    enemy.target = saulo
    return { saulo, scene, graphic }
}

describe("Saulo runaway movement", () => {
    it("turns immediately at a wall with a pursuer behind him and runs across the arena again", () => {
        const { saulo } = setup()
        saulo.withTargetUpdate()
        expect(saulo.body.velocity.x).toBeGreaterThan(0)
        saulo.body.reset(190, 75)
        saulo.withTargetUpdate()
        expect(saulo.body.velocity.x).toBeLessThan(0)
        expect(saulo.x + saulo.body.width / 2).toBe(200)
        saulo.body.reset(10, 75)
        saulo.withTargetUpdate()
        expect(saulo.body.velocity.x).toBeGreaterThan(0)
    })

    it("escapes an existing corner even if the random direction points outward", () => {
        const { saulo } = setup()
        saulo.body.reset(190, 20)
        saulo.withTargetUpdate()
        expect(saulo.body.velocity.x).toBeLessThan(0)
    })

    it("clamps an overshot frame at the physical wall and reverses boosted movement", () => {
        const { saulo } = setup()
        saulo.speed *= 3
        saulo.update(0, 0)
        saulo.body.reset(240, 75)
        saulo.update(16, 16)
        expect(saulo.x).toBe(190)
        expect(saulo.body.velocity.x).toBeLessThan(0)
    })

    it("keeps freeze and movement locks effective while on a wall", () => {
        const { saulo } = setup()
        saulo.body.reset(190, 75)
        saulo.frozen = true
        saulo.withTargetUpdate()
        expect(saulo.body.velocity.x).toBe(0)
        saulo.frozen = false
        saulo.moveLocked = true
        saulo.withTargetUpdate()
        expect(saulo.body.velocity.x).toBe(0)
        saulo.moveLocked = false
        saulo.withTargetUpdate()
        expect(saulo.body.velocity.x).toBeLessThan(0)
    })

    it("keeps a cloud alive until its configured lifetime and cleans it when expired", () => {
        const { saulo, graphic, scene } = setup()
        saulo.update(0, SAULO_GAS_EMIT_INTERVAL_MS)
        expect(scene.perRoundFx.add).toHaveBeenCalledWith(graphic)
        saulo.update(1, SAULO_GAS_CLOUD_DURATION_MS - SAULO_GAS_EMIT_INTERVAL_MS - 1)
        expect(graphic.destroy).not.toHaveBeenCalled()
        saulo.update(2, 1)
        expect(graphic.destroy).toHaveBeenCalledOnce()
        expect(scene.perRoundFx.remove).toHaveBeenCalledWith(graphic, false, false)
    })
})
