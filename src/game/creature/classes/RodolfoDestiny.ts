// src/game/creature/classes/RodolfoDestiny.ts
/**
 * Pure rules for Rodolfo's fate roll. Kept free of Phaser imports so the
 * outcome bands, damage scaling, probabilities and chain ordering can be
 * tested without loading the engine.
 */
export type RodolfoOutcome = "water" | "drill" | "chain" | "nuke"

export const RODOLFO_OUTCOMES: RodolfoOutcome[] = ["water", "drill", "chain", "nuke"]

/** Roll band (inclusive, out of a hundred) that triggers each spell. */
export const RODOLFO_OUTCOME_BANDS: Record<RodolfoOutcome, { min: number; max: number }> = {
    water: { min: 1, max: 59 },
    drill: { min: 60, max: 89 },
    chain: { min: 90, max: 99 },
    nuke: { min: 100, max: 100 },
}

/** Player-facing spell names, shared by the ability description and the damage chart. */
export const RODOLFO_OUTCOME_NAME: Record<RodolfoOutcome, string> = {
    water: "Water Orb",
    drill: "Earth Drill",
    chain: "Chain Lightning",
    nuke: "Nuclear Fireball",
}

export function resolveRodolfoOutcome(roll: number): RodolfoOutcome {
    for (const outcome of RODOLFO_OUTCOMES) {
        const band = RODOLFO_OUTCOME_BANDS[outcome]
        if (roll >= band.min && roll <= band.max) return outcome
    }

    return roll > RODOLFO_OUTCOME_BANDS.nuke.max ? "nuke" : "water"
}

/**
 * Probability of a spell being cast, assuming the roll keeps the highest of
 * `rolls` values. More rolls shift weight toward the rarer bands.
 */
export function rodolfoOutcomeChance(outcome: RodolfoOutcome, rolls = 1): number {
    const band = RODOLFO_OUTCOME_BANDS[outcome]
    const rollCount = Math.max(1, Math.floor(rolls))
    const atMost = band.max / 100
    const below = (band.min - 1) / 100

    return atMost ** rollCount - below ** rollCount
}

export const RODOLFO_OUTCOME_AP_RATIO: Record<RodolfoOutcome, number> = {
    water: 1.2,
    drill: 2.2,
    chain: 3,
    nuke: 6,
}

/** Fraction of the rolled AP damage that splashes around the water impact. */
export const RODOLFO_WATER_SPLASH_RATIO = 0.4
/** Splash radius (px) around the water orb impact. */
export const RODOLFO_WATER_SPLASH_RADIUS = 64
/** Maximum number of enemies a single chain lightning can link. */
export const RODOLFO_CHAIN_TARGETS = 5
/** Each consecutive chain hit deals this fraction of the previous one. */
export const RODOLFO_CHAIN_JUMP_RATIO = 0.5
/** Blast radius (px) of the nuclear fireball around its impact point. */
export const RODOLFO_NUKE_RADIUS = 170

export function rodolfoOutcomeDamage(abilityPower: number, outcome: RodolfoOutcome, multiplier = 1): number {
    return abilityPower * RODOLFO_OUTCOME_AP_RATIO[outcome] * multiplier
}

/** Damage of the n-th chain hit (0 = first target), decaying each jump. */
export function rodolfoChainDamage(baseDamage: number, jumpIndex: number): number {
    return baseDamage * RODOLFO_CHAIN_JUMP_RATIO ** Math.max(0, jumpIndex)
}

export interface RodolfoChainCandidate<T> {
    target: T
    x: number
    y: number
}

/**
 * Order chain targets greedily: each next target is the closest to the one hit
 * before, starting from `source`. Used to link the lightning without repeats.
 */
export function orderRodolfoChainTargets<T>(
    source: { x: number; y: number },
    candidates: RodolfoChainCandidate<T>[],
    maxTargets: number
): T[] {
    const pool = candidates.slice()
    const ordered: T[] = []
    let from = source

    while (ordered.length < maxTargets && pool.length > 0) {
        let bestIndex = 0
        let bestDistance = Number.POSITIVE_INFINITY

        for (let i = 0; i < pool.length; i++) {
            const distance = Math.hypot(pool[i].x - from.x, pool[i].y - from.y)
            if (distance < bestDistance) {
                bestDistance = distance
                bestIndex = i
            }
        }

        const chosen = pool.splice(bestIndex, 1)[0]
        ordered.push(chosen.target)
        from = chosen
    }

    return ordered
}
