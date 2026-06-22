export const DRANHO_CHANNEL_TICK_MS = 650
export const DRANHO_CHANNEL_SELF_AP_RATIO = 0.28
export const DRANHO_CHANNEL_TEAM_AP_RATIO = 0.28

export function calculateDranhoAlliedAverageAp(alliedAbilityPowers: number[]): number {
    if (alliedAbilityPowers.length === 0) return 0

    const total = alliedAbilityPowers.reduce((sum, abilityPower) => sum + Math.max(0, abilityPower), 0)
    return total / alliedAbilityPowers.length
}

export function calculateDranhoChannelDamage(selfAbilityPower: number, alliedAverageAbilityPower: number, multiplier = 1): number {
    const selfContribution = Math.max(0, selfAbilityPower) * DRANHO_CHANNEL_SELF_AP_RATIO
    const teamContribution = Math.max(0, alliedAverageAbilityPower) * DRANHO_CHANNEL_TEAM_AP_RATIO

    return Math.max(0, (selfContribution + teamContribution) * multiplier)
}
