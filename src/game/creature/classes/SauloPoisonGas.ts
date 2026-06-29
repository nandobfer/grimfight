export interface SauloPoint {
    x: number
    y: number
}

export interface SauloGridMetrics {
    left: number
    top: number
    cellW: number
    cellH: number
    cols: number
    rows: number
}

export interface SauloGridCell {
    col: number
    row: number
}

export const SAULO_GAS_CLOUD_DURATION_MS = 2000
export const SAULO_GAS_EMIT_INTERVAL_MS = 180
export const SAULO_GAS_EMIT_DISTANCE = 22
export const SAULO_GAS_RADIUS = 42
export const SAULO_GAS_DOT_DURATION_MS = 1100
export const SAULO_GAS_DOT_TICK_RATE_MS = 500
export const SAULO_GAS_AP_RATIO_PER_TICK = 0.11
export const SAULO_OVERDRIVE_DURATION_MS = 5000
export const SAULO_OVERDRIVE_SPEED_MULTIPLIER = 0.55
export const SAULO_OVERDRIVE_HOT_MAX_HEALTH_RATIO = 0.22
export const SAULO_TARGET_CELL_EDGE_INSET = 6

export function calculateSauloPoisonGasTickDamage(abilityPower: number, multiplier = 1): number {
    return Math.max(0, abilityPower) * SAULO_GAS_AP_RATIO_PER_TICK * multiplier
}

export function calculateSauloOverdriveHealing(maxHealth: number, multiplier = 1): number {
    return Math.max(0, maxHealth) * SAULO_OVERDRIVE_HOT_MAX_HEALTH_RATIO * multiplier
}

export function calculateSauloSpeedBoost(speed: number, multiplier = 1): number {
    return Math.max(0, speed) * SAULO_OVERDRIVE_SPEED_MULTIPLIER * multiplier
}

export function getSauloSingleTargetPatrolEndpoints(grid: SauloGridMetrics, targetCell: SauloGridCell, from: SauloPoint): [SauloPoint, SauloPoint] {
    return getSauloTargetCellCrossingEndpoints(grid, targetCell, from)
}

export function getSauloTargetCellCrossingEndpoints(grid: SauloGridMetrics, targetCell: SauloGridCell, from: SauloPoint): [SauloPoint, SauloPoint] {
    const cell = getClampedCell(grid, targetCell)
    const center = getSauloCellCenter(grid, cell.col, cell.row)
    const dx = from.x - center.x
    const dy = from.y - center.y

    if (Math.abs(dx) >= Math.abs(dy)) {
        const left = getSauloCellEdgePoint(grid, cell, "left")
        const right = getSauloCellEdgePoint(grid, cell, "right")
        return dx <= 0 ? [left, right] : [right, left]
    }

    const top = getSauloCellEdgePoint(grid, cell, "top")
    const bottom = getSauloCellEdgePoint(grid, cell, "bottom")
    return dy <= 0 ? [top, bottom] : [bottom, top]
}

export function chooseSauloInitialPatrolEndpoint(from: SauloPoint, endpoints: [SauloPoint, SauloPoint]): 0 | 1 {
    const firstDistance = getDistanceSquared(from, endpoints[0])
    const secondDistance = getDistanceSquared(from, endpoints[1])
    return firstDistance >= secondDistance ? 0 : 1
}

function getSauloCellCenter(grid: SauloGridMetrics, col: number, row: number): SauloPoint {
    const cell = getClampedCell(grid, { col, row })
    return {
        x: grid.left + (cell.col + 0.5) * grid.cellW,
        y: grid.top + (cell.row + 0.5) * grid.cellH,
    }
}

function getSauloCellEdgePoint(grid: SauloGridMetrics, cell: SauloGridCell, edge: "left" | "right" | "top" | "bottom"): SauloPoint {
    const center = getSauloCellCenter(grid, cell.col, cell.row)
    const halfWidth = Math.max(grid.cellW * 0.25, grid.cellW / 2 - SAULO_TARGET_CELL_EDGE_INSET)
    const halfHeight = Math.max(grid.cellH * 0.25, grid.cellH / 2 - SAULO_TARGET_CELL_EDGE_INSET)

    switch (edge) {
        case "left":
            return { x: center.x - halfWidth, y: center.y }
        case "right":
            return { x: center.x + halfWidth, y: center.y }
        case "top":
            return { x: center.x, y: center.y - halfHeight }
        case "bottom":
            return { x: center.x, y: center.y + halfHeight }
    }
}

function getClampedCell(grid: SauloGridMetrics, cell: SauloGridCell): SauloGridCell {
    return {
        col: Math.max(0, Math.min(grid.cols - 1, cell.col)),
        row: Math.max(0, Math.min(grid.rows - 1, cell.row)),
    }
}

function getDistanceSquared(a: SauloPoint, b: SauloPoint): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return dx * dx + dy * dy
}
