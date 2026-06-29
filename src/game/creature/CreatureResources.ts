export const CREATURE_RAGE_FULL_DAMAGE_FRACTION = 0.45

export function calculateRageFromDamageTaken(damageTaken: number, maxHealth: number, maxRage: number): number {
    if (damageTaken <= 0 || maxHealth <= 0 || maxRage <= 0) return 0
    return Math.max(0, (damageTaken / maxHealth) * (maxRage / CREATURE_RAGE_FULL_DAMAGE_FRACTION))
}
