// src/game/creature/classes/SoritaDice.ts
/**
 * Pure rules for Sorita's loaded dice. Kept free of Phaser imports so the die
 * faces, the loaded-attack damage scaling and the hundred-sided death drop
 * table can be tested without loading the engine.
 */

/** Faces on the loaded die rolled by the active ability. */
export const SORITA_DIE_FACES = 6

/** Face that turns the loaded attack into a guaranteed critical hit. */
export const SORITA_CRIT_FACE = 6

/** Bonus damage per rolled pip, as a fraction of the attacker's current AD. */
export const SORITA_ROLL_DAMAGE_AD_RATIO = 0.3

/** Base AD fraction dealt by the loaded strike before the rolled pips are added. */
export const SORITA_BASE_DAMAGE_AD_RATIO = 1

/**
 * Total AD-scaled damage of the loaded strike for a given roll. A roll of one
 * deals `AD * (base + one pip)` and each further pip adds the same step.
 */
export function soritaRollDamage(attackDamage: number, roll: number): number {
    return attackDamage * (SORITA_BASE_DAMAGE_AD_RATIO + SORITA_ROLL_DAMAGE_AD_RATIO * roll)
}

/** Whether the rolled face guarantees a critical hit on the loaded attack. */
export function soritaRollsCrit(roll: number): boolean {
    return roll >= SORITA_CRIT_FACE
}

/** Damage type of the loaded strike: true damage on the critical face, physical otherwise. */
export function soritaStrikeDamageType(roll: number): "normal" | "true" {
    return soritaRollsCrit(roll) ? "true" : "normal"
}

/** Item tiers the passive can drop when an enemy dies. */
export type SoritaDrop = "artifact" | "completed" | "component"

/**
 * Exact hundred-sided results that trigger each drop tier. Every other result
 * drops nothing, so the passive stays a rare payoff.
 */
export const SORITA_DROP_ROLLS: Record<SoritaDrop, number[]> = {
    artifact: [100],
    completed: [70, 80, 90],
    component: [10, 20, 30, 40, 50, 60],
}

/**
 * Resolves the hundred-sided death roll into a drop tier. Only the listed
 * results drop anything; rarer tiers are checked first.
 */
export function resolveSoritaDrop(roll: number): SoritaDrop | null {
    if (SORITA_DROP_ROLLS.artifact.includes(roll)) return "artifact"
    if (SORITA_DROP_ROLLS.completed.includes(roll)) return "completed"
    if (SORITA_DROP_ROLLS.component.includes(roll)) return "component"
    return null
}

/** Minimal shape of a creature for the death-drop filter. */
export interface SoritaDropTarget {
    master?: unknown
    isClone?: boolean
}

/**
 * Death drops only come from encounter creatures. Summons (which carry a
 * `master`) and temporary clones (slime split copies) are ignored.
 */
export function isSoritaDropTarget(target: SoritaDropTarget): boolean {
    return !target.master && !target.isClone
}

/** Normalized pip positions in `[-1, 1]` for a die face, laid out on a unit square. */
export function soritaDicePips(face: number): Array<{ x: number; y: number }> {
    const corner = 0.6
    const layouts: Record<number, Array<{ x: number; y: number }>> = {
        1: [{ x: 0, y: 0 }],
        2: [
            { x: -corner, y: -corner },
            { x: corner, y: corner },
        ],
        3: [
            { x: -corner, y: -corner },
            { x: 0, y: 0 },
            { x: corner, y: corner },
        ],
        4: [
            { x: -corner, y: -corner },
            { x: corner, y: -corner },
            { x: -corner, y: corner },
            { x: corner, y: corner },
        ],
        5: [
            { x: -corner, y: -corner },
            { x: corner, y: -corner },
            { x: 0, y: 0 },
            { x: -corner, y: corner },
            { x: corner, y: corner },
        ],
        6: [
            { x: -corner, y: -corner },
            { x: corner, y: -corner },
            { x: -corner, y: 0 },
            { x: corner, y: 0 },
            { x: -corner, y: corner },
            { x: corner, y: corner },
        ],
    }

    return layouts[face] ?? []
}
