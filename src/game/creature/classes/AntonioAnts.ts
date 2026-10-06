export const ANTONIO_ANT_DURATION_MS = 3000
export const ANTONIO_ANT_TICK_RATE_MS = 500

export const ANTONIO_EGG_PER_NORMAL_HIT = 1
export const ANTONIO_EXTRA_EGG_ON_CAST = 1

export const ANTONIO_ANT_TICK_AD_RATIO = 0.13
export const ANTONIO_ANT_TICK_AP_RATIO = 0.1

export const ANTONIO_HEAL_PER_EGG_RATIO = 0.01

function safeNonNegative(value: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : 0
}

function calculateHybridDamage(attackDamage: number, abilityPower: number, attackDamageRatio: number, abilityPowerRatio: number, extra: number, multiplier: number): number {
    const base = safeNonNegative(attackDamage) * attackDamageRatio + safeNonNegative(abilityPower) * abilityPowerRatio + safeNonNegative(extra)
    return base * safeNonNegative(multiplier)
}

export function calculateAntonioEggsPerHit(crit: boolean, critDamageMultiplier: number): number {
    if (!crit) return ANTONIO_EGG_PER_NORMAL_HIT

    return Math.max(ANTONIO_EGG_PER_NORMAL_HIT, Math.floor(safeNonNegative(critDamageMultiplier)))
}

export function calculateAntonioAntTickDamage(attackDamage: number, abilityPower: number, multiplier = 1): number {
    return calculateHybridDamage(attackDamage, abilityPower, ANTONIO_ANT_TICK_AD_RATIO, ANTONIO_ANT_TICK_AP_RATIO, 0, multiplier)
}

export function calculateAntonioHealPerEgg(maxHealth: number, eggs: number, multiplier = 1): number {
    return safeNonNegative(maxHealth) * ANTONIO_HEAL_PER_EGG_RATIO * safeNonNegative(eggs) * safeNonNegative(multiplier)
}

export function countAntonioAnts(eggs: number): number {
    return Math.max(0, Math.floor(safeNonNegative(eggs)))
}
