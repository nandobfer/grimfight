export const FERAL_THREATENED_HEALTH_RATIO = 0.3

export function isFeralThreatened(health: number, maxHealth: number): boolean {
    return maxHealth > 0 && health / maxHealth <= FERAL_THREATENED_HEALTH_RATIO
}

export function calculateFeralStatBonus(baseValue: number, multiplier: number, threatened: boolean): number {
    return baseValue * multiplier * (threatened ? 2 : 1)
}
