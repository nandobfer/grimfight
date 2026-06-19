import type { Direction } from "../Creature"

export interface FandralGridCell {
    col: number
    row: number
}

export interface FandralFlameSlashBounds {
    minX: number
    maxX: number
    minY: number
    maxY: number
}

export const FANDRAL_FLAME_SLASH_DURATION_MS = 360
export const FANDRAL_FLAME_SLASH_IMPACT_PROGRESS = 0.48
export const FANDRAL_FLAME_SLASH_BURN_DURATION_MS = 5000
export const FANDRAL_FLAME_SLASH_BURN_TICK_RATE_MS = 1000
export const FANDRAL_FLAME_SLASH_DIRECT_AP_RATIO = 0.375
export const FANDRAL_FLAME_SLASH_BURN_AP_RATIO = 0.75
export const FANDRAL_FLAME_SLASH_BURN_SOURCE = "Flame Slash: Burning"
export const FANDRAL_FLAME_SLASH_AREA_SCALE = 1.25
export const FANDRAL_FLAME_SLASH_SWEEP_RATIO = 0.28
export const FANDRAL_FLAME_SLASH_HIT_PADDING_PX = 8

export function calculateFandralFlameSlashDirectDamage(abilityPower: number, multiplier = 1): number {
    return Math.max(0, abilityPower * FANDRAL_FLAME_SLASH_DIRECT_AP_RATIO * multiplier)
}

export function calculateFandralFlameSlashBurnTotalDamage(abilityPower: number, multiplier = 1): number {
    return Math.max(0, abilityPower * FANDRAL_FLAME_SLASH_BURN_AP_RATIO * multiplier)
}

export function getFandralFlameSlashBurnTickCount(): number {
    return Math.max(1, FANDRAL_FLAME_SLASH_BURN_DURATION_MS / FANDRAL_FLAME_SLASH_BURN_TICK_RATE_MS)
}

export function calculateFandralFlameSlashBurnTickDamage(abilityPower: number, multiplier = 1): number {
    return calculateFandralFlameSlashBurnTotalDamage(abilityPower, multiplier) / getFandralFlameSlashBurnTickCount()
}

export function getFandralFlameSlashCells(center: FandralGridCell, facing: Direction, cols: number, rows: number): FandralGridCell[] {
    const offsets = [-1, 0, 1]
    const cells = offsets.map((offset) => {
        if (facing === "up" || facing === "down") {
            return { col: center.col + offset, row: center.row }
        }

        return { col: center.col, row: center.row + offset }
    })

    return cells.filter((cell) => cell.col >= 0 && cell.row >= 0 && cell.col < cols && cell.row < rows)
}

export function expandFandralFlameSlashBounds(bounds: FandralFlameSlashBounds, scale = FANDRAL_FLAME_SLASH_AREA_SCALE): FandralFlameSlashBounds {
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    const halfWidth = ((bounds.maxX - bounds.minX) * scale) / 2
    const halfHeight = ((bounds.maxY - bounds.minY) * scale) / 2

    return {
        minX: centerX - halfWidth,
        maxX: centerX + halfWidth,
        minY: centerY - halfHeight,
        maxY: centerY + halfHeight,
    }
}

export function isPointInsideFandralFlameSlashBounds(x: number, y: number, bounds: FandralFlameSlashBounds): boolean {
    return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY
}

export function getFandralFlameSlashVisualSweepDistance(facing: Direction, cellW: number, cellH: number): number {
    return (facing === "up" || facing === "down" ? cellW : cellH) * FANDRAL_FLAME_SLASH_SWEEP_RATIO
}

export function expandFandralFlameSlashBoundsForVisualSweep(
    bounds: FandralFlameSlashBounds,
    facing: Direction,
    cellW: number,
    cellH: number,
    padding = FANDRAL_FLAME_SLASH_HIT_PADDING_PX
): FandralFlameSlashBounds {
    const sweep = getFandralFlameSlashVisualSweepDistance(facing, cellW, cellH)

    if (facing === "up" || facing === "down") {
        return {
            minX: bounds.minX - sweep - padding,
            maxX: bounds.maxX + sweep + padding,
            minY: bounds.minY - padding,
            maxY: bounds.maxY + padding,
        }
    }

    return {
        minX: bounds.minX - padding,
        maxX: bounds.maxX + padding,
        minY: bounds.minY - sweep - padding,
        maxY: bounds.maxY + sweep + padding,
    }
}

export function doFandralFlameSlashBoundsIntersect(a: FandralFlameSlashBounds, b: FandralFlameSlashBounds): boolean {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
}
