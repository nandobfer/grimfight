// src/game/creature/classes/EdnoAegis.ts
/**
 * Pure configuration and helpers for Edno's Spectral Aegis ability.
 * Kept free of Phaser so the roll, shield-count and shield-grant rules stay
 * testable without instantiating engine objects.
 */

/** Faces of the fate die rolled when the ability is cast. */
export const EDNO_DIE_FACES = 4

/** Fraction of the caster's maximum health granted as a temporary shield per pip of the rolled die. */
export const EDNO_SHIELD_HP_RATIO = 0.15

/** How long a conjured aegis stays active, in milliseconds. */
export const EDNO_AEGIS_DURATION_MS = 3000

/** Width of a single spectral shield along its wide axis, in pixels. */
export const EDNO_SHIELD_WIDTH = 192

/** Thickness of a single spectral shield along the facing axis, in pixels. */
export const EDNO_SHIELD_DEPTH = 14

/** How far the crescent bulges toward the enemy, in pixels. */
export const EDNO_SHIELD_BULGE = 26

/** Forward offset between stacked shields, in pixels. */
export const EDNO_SHIELD_STACK_OFFSET = 10

/** Distance from the caster to the first shield, in pixels. */
export const EDNO_SHIELD_FRONT_DISTANCE = 28

/** Number of spectral shields conjured for a given roll. */
export function ednoShieldCount(roll: number): number {
    return Math.max(0, Math.floor(roll))
}

/** Temporary shield granted to the caster for a given roll, scaled by maximum health. */
export function ednoShieldGrant(maxHealth: number, roll: number): number {
    return maxHealth * EDNO_SHIELD_HP_RATIO * ednoShieldCount(roll)
}
