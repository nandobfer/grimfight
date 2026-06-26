export interface CloverPoint {
    x: number
    y: number
}

export const CLOVER_DARK_CLEAVE_AD_RATIO = 1.4
export const CLOVER_DARK_CLEAVE_SPEED = 620
export const CLOVER_DARK_CLEAVE_MIN_RANGE = 220
export const CLOVER_DARK_CLEAVE_MAX_RANGE = 420
export const CLOVER_DARK_CLEAVE_MIN_LENGTH = 74
export const CLOVER_DARK_CLEAVE_MAX_LENGTH = 132
export const CLOVER_DARK_CLEAVE_HIT_RADIUS = 18
export const CLOVER_DARK_CLEAVE_MAX_ANGLE_OFFSET = 0.28

function safeNonNegative(value: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function calculateCloverDarkCleaveDamage(attackDamage: number, multiplier = 1): number {
    return safeNonNegative(attackDamage) * CLOVER_DARK_CLEAVE_AD_RATIO * safeNonNegative(multiplier)
}

export function clampCloverDarkCleaveRange(distanceToTarget: number, rawRange: number): number {
    const minimumRange = Math.max(CLOVER_DARK_CLEAVE_MIN_RANGE, safeNonNegative(distanceToTarget) + CLOVER_DARK_CLEAVE_HIT_RADIUS * 2)
    return Math.min(CLOVER_DARK_CLEAVE_MAX_RANGE, Math.max(minimumRange, safeNonNegative(rawRange)))
}

export function clampCloverDarkCleaveLength(rawLength: number): number {
    return Math.min(CLOVER_DARK_CLEAVE_MAX_LENGTH, Math.max(CLOVER_DARK_CLEAVE_MIN_LENGTH, safeNonNegative(rawLength)))
}

export function distancePointToSegment(point: CloverPoint, start: CloverPoint, end: CloverPoint): number {
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    const lengthSquared = deltaX * deltaX + deltaY * deltaY

    if (lengthSquared <= 0.0001) return Math.hypot(point.x - start.x, point.y - start.y)

    const t = Math.min(1, Math.max(0, ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared))
    const projectedX = start.x + deltaX * t
    const projectedY = start.y + deltaY * t

    return Math.hypot(point.x - projectedX, point.y - projectedY)
}

export function doesCloverDarkCleaveSegmentHit(point: CloverPoint, start: CloverPoint, end: CloverPoint, hitRadius = CLOVER_DARK_CLEAVE_HIT_RADIUS): boolean {
    return distancePointToSegment(point, start, end) <= safeNonNegative(hitRadius)
}
