import { describe, expect, it } from "vitest"
import {
    calculateSauloPoisonGasAverageStacks,
    calculateSauloOverdriveHealing,
    calculateSauloPoisonGasTickDamage,
    calculateSauloSpeedBoost,
    chooseSauloInitialPatrolEndpoint,
    getSauloRunawayWallPoint,
    getSauloMovementBounds,
    getSauloInwardRunawayDirection,
    clampSauloMovementPoint,
    hasSauloReachedMovementPoint,
    getSauloSingleTargetPatrolEndpoints,
    getSauloTargetCellCrossingEndpoints,
    SAULO_GAS_CLOUD_DURATION_MS,
    SAULO_GAS_DOT_DURATION_MS,
    SAULO_GAS_DOT_TICK_RATE_MS,
    SAULO_GAS_RADIUS,
    SAULO_OVERDRIVE_DURATION_MS,
    SAULO_TARGET_CELL_EDGE_INSET,
} from "../../src/game/creature/classes/SauloPoisonGas"

describe("Saulo poison gas", () => {
    it("calculates finite non-negative AP-based gas tick damage", () => {
        const damage = calculateSauloPoisonGasTickDamage(120)
        const amplifiedDamage = calculateSauloPoisonGasTickDamage(120, 1.5)

        expect(Number.isFinite(damage)).toBe(true)
        expect(damage).toBeGreaterThanOrEqual(0)
        expect(amplifiedDamage).toBeCloseTo(damage * 1.5)
    })

    it("derives average temporal poison stacks from dot duration and application interval", () => {
        const stacks = calculateSauloPoisonGasAverageStacks(SAULO_GAS_DOT_DURATION_MS, SAULO_GAS_DOT_TICK_RATE_MS)

        expect(Number.isFinite(stacks)).toBe(true)
        expect(stacks).toBeGreaterThan(1)
        expect(stacks).toBe(SAULO_GAS_DOT_DURATION_MS / SAULO_GAS_DOT_TICK_RATE_MS)
        expect(calculateSauloPoisonGasAverageStacks(0, SAULO_GAS_DOT_TICK_RATE_MS)).toBe(0)
        expect(calculateSauloPoisonGasAverageStacks(SAULO_GAS_DOT_DURATION_MS, 0)).toBe(0)
    })

    it("calculates finite non-negative overdrive healing and speed boost", () => {
        expect(calculateSauloOverdriveHealing(500)).toBeGreaterThan(0)
        expect(calculateSauloSpeedBoost(100)).toBeGreaterThan(0)
        expect(calculateSauloOverdriveHealing(-1)).toBe(0)
        expect(calculateSauloSpeedBoost(-1)).toBe(0)
    })

    it("builds single-target patrol endpoints on the target cell edges", () => {
        const endpoints = getSauloSingleTargetPatrolEndpoints(
            { left: 100, top: 200, cellW: 64, cellH: 64, cols: 6, rows: 8 },
            { col: 3, row: 2 },
            { x: 250, y: 360 }
        )

        expect(endpoints[0]).toEqual({ x: 292 + SAULO_TARGET_CELL_EDGE_INSET, y: 360 })
        expect(endpoints[1]).toEqual({ x: 356 - SAULO_TARGET_CELL_EDGE_INSET, y: 360 })
    })

    it("clamps patrol row to the grid and initially chooses the farther endpoint", () => {
        const endpoints = getSauloSingleTargetPatrolEndpoints(
            { left: 0, top: 0, cellW: 10, cellH: 20, cols: 4, rows: 3 },
            { col: 2, row: 20 },
            { x: 20, y: 50 }
        )

        expect(endpoints[0].y).toBe(50)
        expect(endpoints[1].y).toBe(50)
        expect(chooseSauloInitialPatrolEndpoint({ x: 20, y: 50 }, endpoints)).toBe(1)
        expect(chooseSauloInitialPatrolEndpoint({ x: 38, y: 50 }, endpoints)).toBe(0)
    })

    it("chooses the opposite target-cell edge from the approach side", () => {
        const grid = { left: 100, top: 200, cellW: 64, cellH: 64, cols: 6, rows: 8 }
        const cell = { col: 3, row: 2 }

        expect(getSauloTargetCellCrossingEndpoints(grid, cell, { x: 250, y: 360 })[1]).toEqual({ x: 356 - SAULO_TARGET_CELL_EDGE_INSET, y: 360 })
        expect(getSauloTargetCellCrossingEndpoints(grid, cell, { x: 390, y: 360 })[1]).toEqual({ x: 292 + SAULO_TARGET_CELL_EDGE_INSET, y: 360 })
        expect(getSauloTargetCellCrossingEndpoints(grid, cell, { x: 324, y: 300 })[1]).toEqual({ x: 324, y: 392 - SAULO_TARGET_CELL_EDGE_INSET })
        expect(getSauloTargetCellCrossingEndpoints(grid, cell, { x: 324, y: 420 })[1]).toEqual({ x: 324, y: 328 + SAULO_TARGET_CELL_EDGE_INSET })
    })

    it("projects runaway movement to the first arena wall hit by an arbitrary angle", () => {
        const grid = { left: 0, top: 0, cellW: 50, cellH: 50, cols: 4, rows: 3 }

        expect(getSauloRunawayWallPoint(grid, { x: 50, y: 50 }, { x: 1, y: 0.5 })).toEqual({ x: 200, y: 125 })
        expect(getSauloRunawayWallPoint(grid, { x: 50, y: 50 }, { x: -0.5, y: -1 })).toEqual({ x: 25, y: 0 })
    })

    it("uses the opposite vector to cross back to the opposite arena wall", () => {
        const grid = { left: 0, top: 0, cellW: 50, cellH: 50, cols: 4, rows: 3 }

        const firstWall = getSauloRunawayWallPoint(grid, { x: 50, y: 50 }, { x: 1, y: 0.5 })
        const oppositeWall = getSauloRunawayWallPoint(grid, firstWall, { x: -1, y: -0.5 })

        expect(oppositeWall).toEqual({ x: 0, y: 25 })
    })

    it("can project runaway movement to an inset wall to keep the body away from colliders", () => {
        const grid = { left: 0, top: 0, cellW: 50, cellH: 50, cols: 4, rows: 3 }

        expect(getSauloRunawayWallPoint(grid, { x: 50, y: 50 }, { x: 1, y: 0.5 }, 20)).toEqual({ x: 180, y: 115 })
        expect(getSauloRunawayWallPoint(grid, { x: 50, y: 50 }, { x: -0.5, y: -1 }, 20)).toEqual({ x: 35, y: 20 })
    })

    it("returns the clamped origin when runaway direction has no movement", () => {
        const grid = { left: 10, top: 20, cellW: 30, cellH: 40, cols: 2, rows: 2 }

        expect(getSauloRunawayWallPoint(grid, { x: 200, y: -10 }, { x: 0, y: 0 })).toEqual({ x: 70, y: 20 })
    })

    it("accounts for asymmetric body extents so each physical edge reaches the arena wall", () => {
        const arena = { left: 0, top: 0, cellW: 200, cellH: 150, cols: 1, rows: 1 }
        const anchor = { x: 50, y: 60 }
        const body = { left: 40, right: 60, top: 40, bottom: 65 }
        const bounds = getSauloMovementBounds(arena, body, anchor)
        expect(bounds).toEqual({ left: 10, top: 20, cellW: 180, cellH: 125, cols: 1, rows: 1 })
        expect(clampSauloMovementPoint(bounds, { x: -50, y: 200 })).toEqual({ x: 10, y: 145 })
        expect(getSauloRunawayWallPoint(bounds, anchor, { x: 0, y: 1 }).y + body.bottom - anchor.y).toBe(150)
        expect(getSauloRunawayWallPoint(bounds, anchor, { x: 1, y: 0 }).x + body.right - anchor.x).toBe(200)
    })

    it("reflects outward directions at every wall and corner into a useful inward route", () => {
        const arena = { left: 0, top: 0, cellW: 200, cellH: 150, cols: 1, rows: 1 }
        for (const origin of [{ x: 0, y: 50 }, { x: 200, y: 50 }, { x: 50, y: 0 }, { x: 50, y: 150 },
            { x: 0, y: 0 }, { x: 200, y: 0 }, { x: 0, y: 150 }, { x: 200, y: 150 }]) {
            for (const direction of [{ x: 1, y: 0.5 }, { x: -1, y: 0.5 }, { x: 1, y: -0.5 }, { x: -1, y: -0.5 }]) {
                const inward = getSauloInwardRunawayDirection(arena, origin, direction)
                const destination = getSauloRunawayWallPoint(arena, origin, inward)
                expect(Math.hypot(destination.x - origin.x, destination.y - origin.y)).toBeGreaterThan(0)
                expect(clampSauloMovementPoint(arena, destination)).toEqual(destination)
                expect(Math.hypot(inward.x, inward.y)).toBeCloseTo(Math.hypot(direction.x, direction.y))
            }
        }
    })

    it("recognizes reaching or crossing an endpoint during a long frame without claiming parallel near misses", () => {
        const destination = { x: 100, y: 50 }
        expect(hasSauloReachedMovementPoint({ x: 100, y: 50 }, destination, 4)).toBe(true)
        expect(hasSauloReachedMovementPoint({ x: 130, y: 50 }, destination, 4, { x: 70, y: 50 })).toBe(true)
        expect(hasSauloReachedMovementPoint({ x: 130, y: 70 }, destination, 4, { x: 70, y: 70 })).toBe(false)
        expect(hasSauloReachedMovementPoint({ x: 70, y: 50 }, destination, 4, { x: 70, y: 50 })).toBe(false)
    })

    it("exposes positive finite timing and radius constants", () => {
        for (const value of [SAULO_GAS_CLOUD_DURATION_MS, SAULO_GAS_DOT_TICK_RATE_MS, SAULO_GAS_RADIUS, SAULO_OVERDRIVE_DURATION_MS]) {
            expect(Number.isFinite(value)).toBe(true)
            expect(value).toBeGreaterThan(0)
        }
    })
})
