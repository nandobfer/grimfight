export type ThresholdDamageInput = {
    currentHealth: number
    maxHealth: number
    shield: number
    armor: number
    damage: number
    damageType: string
    threshold: number
    alreadyTriggered: boolean
}

export function getDamageResistanceMultiplier(armor: number, damageType: string): number {
    return damageType === "true" ? 1 : Math.max(0, 1 - armor / 100)
}

export function calculateThresholdProtectedDamage(input: ThresholdDamageInput): number {
    if (input.alreadyTriggered || input.maxHealth <= 0 || input.currentHealth <= 0) return input.damage
    if (input.damage <= 0) return input.damage

    const thresholdHealth = input.maxHealth * input.threshold
    if (input.currentHealth <= thresholdHealth) return input.damage

    const resistanceMultiplier = getDamageResistanceMultiplier(input.armor, input.damageType)
    if (resistanceMultiplier <= 0) return input.damage

    const finalDamage = input.damage * resistanceMultiplier
    const maxFinalDamageBeforeTrigger = Math.max(0, input.shield) + Math.max(0, input.currentHealth - thresholdHealth)

    if (finalDamage <= maxFinalDamageBeforeTrigger) return input.damage

    return maxFinalDamageBeforeTrigger / resistanceMultiplier
}
