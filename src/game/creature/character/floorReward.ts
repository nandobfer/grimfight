/**
 * Pure helpers for floor victory rewards.
 *
 * Kept free of any Phaser dependency so the reward rules can be unit tested in
 * a plain Node environment. The PlayerTeam delegates the gold math here and the
 * scene only decides whether the victory was fast.
 */

/** Flat amount added to every floor victory before the per-floor scaling. */
export const floorRewardBaseGold = 1
/** Per-floor scaling applied on top of the flat victory gold. */
export const floorRewardGoldPerFloor = 0.5
/** Fraction of the base victory gold granted as a bonus for winning within the battle time. */
export const fastVictoryGoldBonusRatio = 0.1

export interface FloorVictoryReward {
    baseGold: number
    bonusGold: number
    totalGold: number
}

/** Gold granted by a regular floor victory, before any fast-victory bonus. */
export function calculateFloorVictoryGold(floor: number): number {
    return floorRewardBaseGold + Math.round(floor * floorRewardGoldPerFloor)
}

/**
 * Bonus gold for winning within the battle time. The fraction is always rounded
 * up so a fast victory is rewarded on every floor.
 */
export function calculateFastVictoryGoldBonus(baseGold: number, bonusRatio: number = fastVictoryGoldBonusRatio): number {
    if (!Number.isFinite(baseGold) || baseGold <= 0) return 0
    return Math.ceil(baseGold * bonusRatio)
}

/** Full victory reward breakdown for a floor, honoring the fast-victory bonus. */
export function calculateFloorVictoryReward(floor: number, fastVictory: boolean): FloorVictoryReward {
    const baseGold = calculateFloorVictoryGold(floor)
    const bonusGold = fastVictory ? calculateFastVictoryGoldBonus(baseGold) : 0

    return {
        baseGold,
        bonusGold,
        totalGold: baseGold + bonusGold,
    }
}
