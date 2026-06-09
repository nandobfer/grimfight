export const YUE_FIRE_RAY_DAMAGE_AP_RATIO = 1.25
export const YUE_FIRE_RAY_DURATION_MS = 250

export function calculateYueFireRayDamage(abilityPower: number, multiplier = 1): number {
    return abilityPower * YUE_FIRE_RAY_DAMAGE_AP_RATIO * multiplier
}
