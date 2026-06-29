export const NALA_SERPENT_COUNT = 5
export const NALA_SERPENT_DURATION_MS = 2200
export const NALA_SERPENT_HOMING_DELAY_MS = 140
export const NALA_SERPENT_DOT_DURATION_MS = 4000
export const NALA_SERPENT_DOT_TICK_RATE_MS = 1000

export const NALA_SERPENT_IMPACT_AD_RATIO = 0.35
export const NALA_SERPENT_IMPACT_AP_RATIO = 0.2
export const NALA_SERPENT_DOT_AD_RATIO_PER_TICK = 0.06
export const NALA_SERPENT_DOT_AP_RATIO_PER_TICK = 0.08

function safeNonNegative(value: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function calculateNalaSerpentImpactDamage(attackDamage: number, abilityPower: number, multiplier = 1): number {
    return calculateHybridDamage(attackDamage, abilityPower, NALA_SERPENT_IMPACT_AD_RATIO, NALA_SERPENT_IMPACT_AP_RATIO, multiplier)
}

export function calculateNalaSerpentDotTickDamage(attackDamage: number, abilityPower: number, multiplier = 1): number {
    return calculateHybridDamage(attackDamage, abilityPower, NALA_SERPENT_DOT_AD_RATIO_PER_TICK, NALA_SERPENT_DOT_AP_RATIO_PER_TICK, multiplier)
}

export function calculateNalaSerpentDotTotalRawDamage(attackDamage: number, abilityPower: number, multiplier = 1): number {
    return calculateNalaSerpentDotTickDamage(attackDamage, abilityPower, multiplier) * (NALA_SERPENT_DOT_DURATION_MS / NALA_SERPENT_DOT_TICK_RATE_MS)
}

export function calculateNalaSerpentTotalRawDamage(attackDamage: number, abilityPower: number, multiplier = 1): number {
    return calculateNalaSerpentImpactDamage(attackDamage, abilityPower, multiplier) + calculateNalaSerpentDotTotalRawDamage(attackDamage, abilityPower, multiplier)
}

function calculateHybridDamage(attackDamage: number, abilityPower: number, attackDamageRatio: number, abilityPowerRatio: number, multiplier: number): number {
    return (safeNonNegative(attackDamage) * attackDamageRatio + safeNonNegative(abilityPower) * abilityPowerRatio) * safeNonNegative(multiplier)
}
