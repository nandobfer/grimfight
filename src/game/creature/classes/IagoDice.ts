/**
 * Pure rules for Iago's two passives, kept free of Phaser so they can be tested
 * directly in Node.
 *
 * - Passive 1: his critical chance is guided by fate. The Destiny roll keeps the
 *   best of several attempts, which for a critical *check* is equivalent to "at
 *   least one of the attempts succeeds". We compute that equivalent chance.
 * - Passive 2: every basic attack rolls a single twenty-sided die; the top face
 *   unleashes a wind whirlwind that travels straight forward.
 */

export const IAGO_WHIRLWIND_DIE_FACES = 20
export const IAGO_WHIRLWIND_AD_RATIO = 2
export const IAGO_WHIRLWIND_AP_RATIO = 1

/** Whether a twenty-sided roll triggers the whirlwind. */
export function iagoRollsWhirlwind(roll: number): boolean {
    return roll === IAGO_WHIRLWIND_DIE_FACES
}

/**
 * Effective chance of triggering the whirlwind once the Destiny roll keeps the
 * best of `destinyRolls` attempts.
 */
export function iagoWhirlwindProcChance(destinyRolls: number): number {
    const rolls = Math.max(1, Math.floor(destinyRolls))
    const perRoll = 1 / IAGO_WHIRLWIND_DIE_FACES
    return (1 - Math.pow(1 - perRoll, rolls)) * 100
}

/** Travel direction of the whirlwind: from the caster toward the target. */
export function iagoWhirlwindAngle(fromX: number, fromY: number, toX: number, toY: number): number {
    return Math.atan2(toY - fromY, toX - fromX)
}

/** Raw whirlwind damage, scaling with both attack damage and ability power. */
export function iagoWhirlwindDamage(attackDamage: number, abilityPower: number): number {
    return attackDamage * IAGO_WHIRLWIND_AD_RATIO + abilityPower * IAGO_WHIRLWIND_AP_RATIO
}

/**
 * Effective critical chance once the Destiny roll keeps the best of `destinyRolls`
 * attempts. Equivalent to rolling the critical check once per fate roll and
 * keeping any success.
 */
export function iagoEffectiveCritChance(baseChance: number, destinyRolls: number): number {
    const base = Math.min(100, Math.max(0, baseChance)) / 100
    const rolls = Math.max(1, Math.floor(destinyRolls))
    return (1 - Math.pow(1 - base, rolls)) * 100
}

/** Extra critical chance points granted by the Destiny roll on top of the base. */
export function iagoDestinyCritBonus(baseChance: number, destinyRolls: number): number {
    return Math.max(0, iagoEffectiveCritChance(baseChance, destinyRolls) - baseChance)
}
