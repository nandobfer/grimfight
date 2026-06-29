export const LUCIO_POISON_BUBBLE_DURATION_MS = 5000
export const LUCIO_POISON_BUBBLE_TICK_RATE_MS = 1000

const lucioPoisonBubbleApRatioPerTick = 0.35

export function calculateLucioPoisonBubbleTotalApRatio(multiplier = 1): number {
    return lucioPoisonBubbleApRatioPerTick * (LUCIO_POISON_BUBBLE_DURATION_MS / LUCIO_POISON_BUBBLE_TICK_RATE_MS) * multiplier
}

export function calculateLucioPoisonBubbleTickDamage(abilityPower: number, multiplier = 1): number {
    return Math.max(0, abilityPower * lucioPoisonBubbleApRatioPerTick * multiplier)
}

export function calculateLucioPoisonBubbleTotalRawDamage(abilityPower: number, multiplier = 1): number {
    return calculateLucioPoisonBubbleTickDamage(abilityPower, multiplier) * (LUCIO_POISON_BUBBLE_DURATION_MS / LUCIO_POISON_BUBBLE_TICK_RATE_MS)
}
