import { calculateRageFromDamageTaken, CREATURE_RAGE_FULL_DAMAGE_FRACTION } from "../CreatureResources"

export type HelynaForm = "human" | "bear" | "cat"

export interface HelynaHealingCandidate {
    health: number
    maxHealth: number
    active?: boolean
}

export const HELYNA_TRANSFORMATION_DURATION_MS = 10000
export const HELYNA_RAGE_MAX = 100
export const HELYNA_RAGE_FULL_DAMAGE_FRACTION = CREATURE_RAGE_FULL_DAMAGE_FRACTION
export const HELYNA_ENERGY_MAX = 100
export const HELYNA_ENERGY_REGEN_PER_SECOND = 10
export const HELYNA_FRENZIED_REGENERATION_RAGE_COST = 75
export const HELYNA_FRENZIED_REGENERATION_DURATION_MS = 5000
export const HELYNA_FRENZIED_REGENERATION_TICK_RATE_MS = 500
export const HELYNA_FRENZIED_REGENERATION_HEALTH_THRESHOLD = 0.7
export const HELYNA_RAKE_ENERGY_COST = 50
export const HELYNA_RAKE_COOLDOWN_MS = 2000
export const HELYNA_RAKE_DURATION_MS = 4000
export const HELYNA_RAKE_TICK_RATE_MS = 1000

export const HELYNA_HUMAN_REGROWTH_AP_RATIO = 0.5
export const HELYNA_HUMAN_REJUVENATION_AP_RATIO = 1
export const HELYNA_BEAR_MAX_HEALTH_AP_RATIO = 4
export const HELYNA_BEAR_ATTACK_DAMAGE_AP_RATIO = 0.2
export const HELYNA_CAT_ATTACK_DAMAGE_AP_RATIO = 0.45
export const HELYNA_CAT_ATTACK_SPEED_MULTIPLIER = 1.25
export const HELYNA_CAT_SPEED_MULTIPLIER = 2
export const HELYNA_CAT_CRIT_CHANCE_AP_RATIO = 0.01
export const HELYNA_FRENZIED_REGENERATION_AP_RATIO = 1.5
export const HELYNA_FRENZIED_REGENERATION_MAX_HEALTH_RATIO = 0.05
export const HELYNA_RAKE_ATTACK_DAMAGE_RATIO = 2.2

export function calculateHelynaRageFromDamageTaken(damageTaken: number, maxHealth: number, maxRage = HELYNA_RAGE_MAX): number {
    return calculateRageFromDamageTaken(damageTaken, maxHealth, maxRage)
}

export function regenerateHelynaEnergy(currentEnergy: number, deltaMs: number, maxEnergy = HELYNA_ENERGY_MAX): number {
    if (maxEnergy <= 0) return 0
    const gained = Math.max(0, (deltaMs / 1000) * HELYNA_ENERGY_REGEN_PER_SECOND)
    return Math.min(maxEnergy, Math.max(0, currentEnergy) + gained)
}

export function calculateHelynaBearMaxHealth(baseMaxHealth: number, abilityPower: number): number {
    return Math.max(1, baseMaxHealth + Math.max(0, abilityPower) * HELYNA_BEAR_MAX_HEALTH_AP_RATIO)
}

export function calculateHelynaBearAttackDamage(baseAttackDamage: number, abilityPower: number): number {
    return Math.max(0, baseAttackDamage + Math.max(0, abilityPower) * HELYNA_BEAR_ATTACK_DAMAGE_AP_RATIO)
}

export function calculateHelynaCatAttackDamage(baseAttackDamage: number, abilityPower: number): number {
    return Math.max(0, baseAttackDamage + Math.max(0, abilityPower) * HELYNA_CAT_ATTACK_DAMAGE_AP_RATIO)
}

export function calculateHelynaRegrowthHealing(abilityPower: number, multiplier = 1): number {
    return Math.max(0, abilityPower * HELYNA_HUMAN_REGROWTH_AP_RATIO * multiplier)
}

export function calculateHelynaRejuvenationHealing(abilityPower: number, multiplier = 1): number {
    return Math.max(0, abilityPower * HELYNA_HUMAN_REJUVENATION_AP_RATIO * multiplier)
}

export function calculateHelynaFrenziedRegenerationHealing(abilityPower: number, maxHealth: number, multiplier = 1): number {
    const rawHealing = abilityPower * HELYNA_FRENZIED_REGENERATION_AP_RATIO + maxHealth * HELYNA_FRENZIED_REGENERATION_MAX_HEALTH_RATIO
    return Math.max(0, rawHealing * multiplier)
}

export function calculateHelynaRakeTotalDamage(attackDamage: number, multiplier = 1): number {
    return Math.max(0, attackDamage * HELYNA_RAKE_ATTACK_DAMAGE_RATIO * multiplier)
}

export function getHelynaRakeTickCount(): number {
    return Math.max(1, HELYNA_RAKE_DURATION_MS / HELYNA_RAKE_TICK_RATE_MS)
}

export function calculateHelynaRakeTickDamage(attackDamage: number, multiplier = 1): number {
    return calculateHelynaRakeTotalDamage(attackDamage, multiplier) / getHelynaRakeTickCount()
}

export function selectHelynaHealingTargets<T extends HelynaHealingCandidate>(candidates: T[], casts = 2): T[] {
    const damaged = candidates
        .filter((candidate) => candidate.active !== false && candidate.maxHealth > 0 && candidate.health < candidate.maxHealth)
        .sort((a, b) => a.health / a.maxHealth - b.health / b.maxHealth)

    if (damaged.length === 0 || casts <= 0) return []
    if (damaged.length === 1) return Array.from({ length: casts }, () => damaged[0])

    const targets = damaged.slice(0, casts)
    while (targets.length < casts) {
        targets.push(damaged[0])
    }
    return targets
}
