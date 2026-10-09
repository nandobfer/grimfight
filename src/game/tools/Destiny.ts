// src/game/tools/Destiny.ts
/**
 * Pure helper for fate/destiny rolls. A destiny effect rolls several times
 * and keeps the highest value instead of a single roll.
 */
export function maxOfRolls(rolls: number, roll: () => number): number {
    const count = Math.max(1, Math.floor(rolls))
    let best = -Infinity

    for (let i = 0; i < count; i++) {
        best = Math.max(best, roll())
    }

    return best
}
