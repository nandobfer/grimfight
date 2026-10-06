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

export interface SauloVector {
    x: number
    y: number
}

export const SAULO_GAS_CLOUD_DURATION_MS = 2500
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

export function calculateSauloPoisonGasAverageStacks(dotDurationMs: number, applicationIntervalMs: number): number {
    if (dotDurationMs <= 0 || applicationIntervalMs <= 0) return 0

    return dotDurationMs / applicationIntervalMs
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

export function getSauloRunawayWallPoint(grid: SauloGridMetrics, from: SauloPoint, direction: SauloVector, wallInset = 0): SauloPoint {
    const bounds = getSauloGridBounds(grid, wallInset)
    const origin = {
        x: clamp(from.x, bounds.left, bounds.right),
        y: clamp(from.y, bounds.top, bounds.bottom),
    }
    // An outward ray starting on a wall has already reached its destination.
    if ((origin.x <= bounds.left && direction.x < 0) || (origin.x >= bounds.right && direction.x > 0) ||
        (origin.y <= bounds.top && direction.y < 0) || (origin.y >= bounds.bottom && direction.y > 0)) return origin
    const candidates: SauloPoint[] = []

    addVerticalRayIntersection(candidates, bounds.left, bounds, origin, direction)
    addVerticalRayIntersection(candidates, bounds.right, bounds, origin, direction)
    addHorizontalRayIntersection(candidates, bounds.top, bounds, origin, direction)
    addHorizontalRayIntersection(candidates, bounds.bottom, bounds, origin, direction)

    let chosen: SauloPoint | undefined
    let chosenDistance = Number.POSITIVE_INFINITY

    for (const candidate of candidates) {
        const distance = getDistanceSquared(origin, candidate)
        if (distance < chosenDistance) {
            chosen = candidate
            chosenDistance = distance
        }
    }

    return chosen ?? origin
}

/** Convert arena edges into reachable sprite-anchor coordinates using body extents. */
export function getSauloMovementBounds(arena: SauloGridMetrics, body: { left: number; right: number; top: number; bottom: number }, anchor: SauloPoint): SauloGridMetrics {
    const left = arena.left + anchor.x - body.left
    const top = arena.top + anchor.y - body.top
    const right = arena.left + arena.cols * arena.cellW + anchor.x - body.right
    const bottom = arena.top + arena.rows * arena.cellH + anchor.y - body.bottom
    return { left, top, cellW: Math.max(0, right - left), cellH: Math.max(0, bottom - top), cols: 1, rows: 1 }
}

export function clampSauloMovementPoint(bounds: SauloGridMetrics, point: SauloPoint): SauloPoint {
    return { x: clamp(point.x, bounds.left, bounds.left + bounds.cellW * bounds.cols),
        y: clamp(point.y, bounds.top, bounds.top + bounds.cellH * bounds.rows) }
}

/** Reflect only outward components so mixed directions can escape corners. */
export function getSauloInwardRunawayDirection(bounds: SauloGridMetrics, from: SauloPoint, direction: SauloVector): SauloVector {
    const epsilon = 0.001
    return {
        x: (from.x <= bounds.left + epsilon && direction.x < 0) ||
            (from.x >= bounds.left + bounds.cellW * bounds.cols - epsilon && direction.x > 0) ? -direction.x : direction.x,
        y: (from.y <= bounds.top + epsilon && direction.y < 0) ||
            (from.y >= bounds.top + bounds.cellH * bounds.rows - epsilon && direction.y > 0) ? -direction.y : direction.y,
    }
}

export function hasSauloReachedMovementPoint(current: SauloPoint, destination: SauloPoint, radius: number, previous?: SauloPoint): boolean {
    if (getDistanceSquared(current, destination) <= radius * radius) return true
    if (!previous) return false
    const dx = current.x - previous.x
    const dy = current.y - previous.y
    const lengthSquared = dx * dx + dy * dy
    if (lengthSquared === 0) return false
    const t = clamp(((destination.x - previous.x) * dx + (destination.y - previous.y) * dy) / lengthSquared, 0, 1)
    return getDistanceSquared({ x: previous.x + dx * t, y: previous.y + dy * t }, destination) <= radius * radius
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

function getSauloGridBounds(grid: SauloGridMetrics, inset = 0) {
    const safeInset = Math.max(0, Math.min(inset, (grid.cols * grid.cellW) / 2, (grid.rows * grid.cellH) / 2))

    return {
        left: grid.left + safeInset,
        right: grid.left + grid.cols * grid.cellW - safeInset,
        top: grid.top + safeInset,
        bottom: grid.top + grid.rows * grid.cellH - safeInset,
    }
}

function addVerticalRayIntersection(
    candidates: SauloPoint[],
    x: number,
    bounds: ReturnType<typeof getSauloGridBounds>,
    origin: SauloPoint,
    direction: SauloVector
): void {
    if (direction.x === 0) return

    const t = (x - origin.x) / direction.x
    if (t <= 0) return

    const y = origin.y + direction.y * t
    if (y < bounds.top || y > bounds.bottom) return

    candidates.push({ x, y })
}

function addHorizontalRayIntersection(
    candidates: SauloPoint[],
    y: number,
    bounds: ReturnType<typeof getSauloGridBounds>,
    origin: SauloPoint,
    direction: SauloVector
): void {
    if (direction.y === 0) return

    const t = (y - origin.y) / direction.y
    if (t <= 0) return

    const x = origin.x + direction.x * t
    if (x < bounds.left || x > bounds.right) return
    candidates.push({ x, y })
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
}

function getDistanceSquared(a: SauloPoint, b: SauloPoint): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return dx * dx + dy * dy
}
