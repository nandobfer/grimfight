export interface RagnarosLavaPoint {
    x: number
    y: number
}

export const RAGNAROS_LAVA_RETALIATION_COOLDOWN_MS = 2000
export const RAGNAROS_LAVA_RETALIATION_RANGE = 150
export const RAGNAROS_LAVA_RETALIATION_HALF_ANGLE = Math.PI / 4
export const RAGNAROS_LAVA_RETALIATION_AP_RATIO = 0.8
export const RAGNAROS_LAVA_RETALIATION_FX_DURATION_MS = 360

export function calculateRagnarosLavaRetaliationDamage(abilityPower: number, multiplier = 1) {
    return Math.max(0, abilityPower * RAGNAROS_LAVA_RETALIATION_AP_RATIO * multiplier)
}

export function isPointInsideRagnarosLavaCone(
    origin: RagnarosLavaPoint,
    point: RagnarosLavaPoint,
    angle: number,
    range = RAGNAROS_LAVA_RETALIATION_RANGE,
    halfAngle = RAGNAROS_LAVA_RETALIATION_HALF_ANGLE
) {
    const dx = point.x - origin.x
    const dy = point.y - origin.y
    const distance = Math.hypot(dx, dy)
    if (distance > range) return false
    if (distance === 0) return true

    const pointAngle = Math.atan2(dy, dx)
    const delta = Math.atan2(Math.sin(pointAngle - angle), Math.cos(pointAngle - angle))
    return Math.abs(delta) <= halfAngle
}

export function getRagnarosLavaConePoints(
    origin: RagnarosLavaPoint,
    angle: number,
    range = RAGNAROS_LAVA_RETALIATION_RANGE,
    halfAngle = RAGNAROS_LAVA_RETALIATION_HALF_ANGLE,
    segments = 10
) {
    const points: RagnarosLavaPoint[] = [origin]
    const safeSegments = Math.max(1, Math.floor(segments))

    for (let index = 0; index <= safeSegments; index++) {
        const progress = index / safeSegments
        const arcAngle = angle - halfAngle + halfAngle * 2 * progress
        points.push({
            x: origin.x + Math.cos(arcAngle) * range,
            y: origin.y + Math.sin(arcAngle) * range,
        })
    }

    return points
}
