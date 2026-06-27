export const ROBILTON_BASE_CAST_MS = 1000
export const ROBILTON_MIN_CAST_MS = 350
export const ROBILTON_MAX_CAST_MS = 1600
export const ROBILTON_BLACK_HOLE_DURATION_MS = 1000
export const ROBILTON_NEUTRON_STAR_SPEED = 620
export const ROBILTON_ATTACK_PROJECTILE_SPEED = 520

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function safeNonNegative(value: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function calculateRobiltonCastDuration(attackSpeed: number): number {
    const safeAttackSpeed = Math.max(0.01, safeNonNegative(attackSpeed))

    return clamp(ROBILTON_BASE_CAST_MS / safeAttackSpeed, ROBILTON_MIN_CAST_MS, ROBILTON_MAX_CAST_MS)
}

export function calculateRobiltonStarRadius(abilityPower: number): number {
    return 14 + safeNonNegative(abilityPower) * 0.06
}

export function calculateRobiltonExplosionDamage(abilityPower: number, multiplier = 1): number {
    return safeNonNegative(abilityPower) * 2 * safeNonNegative(multiplier)
}

export function calculateRobiltonExplosionRadius(abilityPower: number): number {
    return 90 + safeNonNegative(abilityPower) * 0.18
}

export function calculateRobiltonBlackHoleRadius(abilityPower: number): number {
    return 105 + safeNonNegative(abilityPower) * 0.25
}

export function calculateRobiltonBlackHolePullStrength(abilityPower: number): number {
    return 70 + safeNonNegative(abilityPower) * 0.4
}

export function calculateRobiltonGravityOrbDamage(abilityPower: number, stacks: number, multiplier = 1): number {
    return Math.floor(safeNonNegative(stacks)) * safeNonNegative(abilityPower) * 0.3 * safeNonNegative(multiplier)
}
