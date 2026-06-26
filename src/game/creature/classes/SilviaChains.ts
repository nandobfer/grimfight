export type SilviaFacing = "left" | "up" | "down" | "right"

export interface SilviaPoint {
    x: number
    y: number
}

export const SILVIA_PASSIVE_HEALTH_FROM_AP_RATIO = 1.3
export const SILVIA_PASSIVE_AP_FROM_HEALTH_RATIO = 0.05
export const SILVIA_CHAIN_DAMAGE_AP_RATIO = 1.35
export const SILVIA_CHAIN_TRAVEL_MS = 520
export const SILVIA_CHAIN_MAX_DURATION_MS = 1100
export const SILVIA_CHAIN_HIT_DISTANCE = 18
export const SILVIA_PULL_FRONT_DISTANCE = 44
export const SILVIA_PULL_DURATION_MS = 260

function safeNonNegative(value: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function calculateSilviaBonusMaxHealth(abilityPower: number): number {
    return safeNonNegative(abilityPower) * SILVIA_PASSIVE_HEALTH_FROM_AP_RATIO
}

export function calculateSilviaBonusAbilityPower(maxHealth: number): number {
    return safeNonNegative(maxHealth) * SILVIA_PASSIVE_AP_FROM_HEALTH_RATIO
}

export function calculateSilviaPassiveBonuses(snapshotAbilityPower: number, snapshotMaxHealth: number): {
    maxHealthBonus: number
    abilityPowerBonus: number
} {
    return {
        maxHealthBonus: calculateSilviaBonusMaxHealth(snapshotAbilityPower),
        abilityPowerBonus: calculateSilviaBonusAbilityPower(snapshotMaxHealth),
    }
}

export function calculateSilviaChainDamage(abilityPower: number, multiplier = 1): number {
    return safeNonNegative(abilityPower) * SILVIA_CHAIN_DAMAGE_AP_RATIO * safeNonNegative(multiplier)
}

function facingVector(facing: SilviaFacing): SilviaPoint {
    switch (facing) {
        case "left":
            return { x: -1, y: 0 }
        case "right":
            return { x: 1, y: 0 }
        case "up":
            return { x: 0, y: -1 }
        case "down":
            return { x: 0, y: 1 }
    }
}

export function getSilviaPullDestination(origin: SilviaPoint, target: SilviaPoint, facing: SilviaFacing, distance = SILVIA_PULL_FRONT_DISTANCE): SilviaPoint {
    const deltaX = target.x - origin.x
    const deltaY = target.y - origin.y
    const length = Math.hypot(deltaX, deltaY)
    const direction = length > 0.001 ? { x: deltaX / length, y: deltaY / length } : facingVector(facing)
    const safeDistance = safeNonNegative(distance)

    return {
        x: origin.x + direction.x * safeDistance,
        y: origin.y + direction.y * safeDistance,
    }
}

export function getSilviaChainPoint(start: SilviaPoint, end: SilviaPoint, progress: number, lateralOffset: number): SilviaPoint {
    const amount = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0))
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    const length = Math.max(1, Math.hypot(deltaX, deltaY))
    const normalX = -deltaY / length
    const normalY = deltaX / length
    const control = {
        x: (start.x + end.x) / 2 + normalX * lateralOffset,
        y: (start.y + end.y) / 2 + normalY * lateralOffset,
    }
    const inverse = 1 - amount

    return {
        x: inverse * inverse * start.x + 2 * inverse * amount * control.x + amount * amount * end.x,
        y: inverse * inverse * start.y + 2 * inverse * amount * control.y + amount * amount * end.y,
    }
}
