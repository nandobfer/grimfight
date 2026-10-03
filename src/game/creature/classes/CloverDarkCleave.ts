export interface CloverPoint {
    x: number
    y: number
}

export const CLOVER_DARK_CLEAVE_AD_RATIO = 2
export const CLOVER_DARK_CLEAVE_SPEED = 620
export const CLOVER_DARK_CLEAVE_HIT_RADIUS = 26
export const CLOVER_DARK_CLEAVE_MAX_ANGLE_OFFSET = 0.28

export interface CloverWallBounds {
    left: number
    right: number
    top: number
    bottom: number
}

/** First contact along a swept segment, including the projectile's physical extent. */
export function getCloverWallContact(start: CloverPoint, end: CloverPoint, wall: CloverWallBounds, paddingX = 0, paddingY = paddingX): number | undefined {
    let enter = 0
    let exit = 1
    const axes = [
        [start.x, end.x - start.x, wall.left - paddingX, wall.right + paddingX],
        [start.y, end.y - start.y, wall.top - paddingY, wall.bottom + paddingY],
    ]
    for (const [origin, delta, minimum, maximum] of axes) {
        if (Math.abs(delta) < 0.000001) {
            if (origin < minimum || origin > maximum) return undefined
            continue
        }
        const first = (minimum - origin) / delta
        const second = (maximum - origin) / delta
        enter = Math.max(enter, Math.min(first, second))
        exit = Math.min(exit, Math.max(first, second))
        if (enter > exit) return undefined
    }
    return enter
}

export function pickCloverDarkCleaveAngle(origin: CloverPoint, target: CloverPoint, offset: number): number {
    const base = Math.atan2(target.y - origin.y, target.x - origin.x)
    const distance = Math.hypot(target.x - origin.x, target.y - origin.y)
    const safeOffset = Math.asin(Math.min(1, CLOVER_DARK_CLEAVE_HIT_RADIUS * 0.5 / Math.max(distance, 1)))
    return base + Math.max(-safeOffset, Math.min(safeOffset, offset))
}

function safeNonNegative(value: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function calculateCloverDarkCleaveDamage(attackDamage: number, multiplier = 1): number {
    return safeNonNegative(attackDamage) * CLOVER_DARK_CLEAVE_AD_RATIO * safeNonNegative(multiplier)
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
