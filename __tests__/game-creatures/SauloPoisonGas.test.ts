import { describe, expect, it } from "vitest"
import {
    calculateSauloPoisonGasAverageStacks,
    calculateSauloOverdriveHealing,
    calculateSauloPoisonGasTickDamage,
    calculateSauloSpeedBoost,
    chooseSauloInitialPatrolEndpoint,
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

    it("exposes positive finite timing and radius constants", () => {
        for (const value of [SAULO_GAS_CLOUD_DURATION_MS, SAULO_GAS_DOT_TICK_RATE_MS, SAULO_GAS_RADIUS, SAULO_OVERDRIVE_DURATION_MS]) {
            expect(Number.isFinite(value)).toBe(true)
            expect(value).toBeGreaterThan(0)
        }
    })
})
